import { parseQueryIntent, synthesizeAnswer } from '@smart-invoice-analyzer/ai';
import {
    assertActiveMembership,
    parseBody,
    resolveRawTeamRequest,
} from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { QueryRequestSchema } from '@smart-invoice-analyzer/contracts';
import { InvoiceRepository, MembershipRepository } from '@smart-invoice-analyzer/data-access';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const { question } = parseBody(event, QueryRequestSchema);
    const config = getConfig();

    const membership = await new MembershipRepository(config.MEMBERSHIP_TABLE).findByIds(
        teamId,
        userId
    );
    assertActiveMembership(membership, teamId, userId);

    const intent = await parseQueryIntent(question);

    const { items: invoices } = await new InvoiceRepository(config.INVOICE_TABLE).list(teamId, {
        dateFrom: intent.filters?.dateFrom,
        dateTo: intent.filters?.dateTo,
        category: intent.filters?.category,
        vendorName: intent.filters?.vendorName,
        limit: 100,
    });

    const aggregates =
        intent.type === 'spending_total'
            ? {
                  totalSpend: invoices.reduce((s, i) => s + (i.totalAmount ?? 0), 0),
                  invoiceCount: invoices.length,
              }
            : undefined;

    return ok(await synthesizeAnswer({ question, invoices, aggregates }));
};

export const handler = createHandler(lambdaHandler);
