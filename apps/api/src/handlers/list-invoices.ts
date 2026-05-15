import {
    assertActiveMembership,
    getQueryParam,
    resolveRawTeamRequest,
} from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { ListInvoicesQuerySchema } from '@smart-invoice-analyzer/contracts';
import { InvoiceRepository, MembershipRepository } from '@smart-invoice-analyzer/data-access';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const config = getConfig();

    const membership = await new MembershipRepository(config.MEMBERSHIP_TABLE).findByIds(
        teamId,
        userId
    );
    assertActiveMembership(membership, teamId, userId);

    const rawQuery = {
        status: getQueryParam(event, 'status'),
        exportStatus: getQueryParam(event, 'exportStatus'),
        category: getQueryParam(event, 'category'),
        vendorName: getQueryParam(event, 'vendorName'),
        dateFrom: getQueryParam(event, 'dateFrom'),
        dateTo: getQueryParam(event, 'dateTo'),
        duplicateFlag: getQueryParam(event, 'duplicateFlag'),
        anomalyFlag: getQueryParam(event, 'anomalyFlag'),
        limit: getQueryParam(event, 'limit'),
        nextToken: getQueryParam(event, 'nextToken'),
    };

    const query = ListInvoicesQuerySchema.parse(
        Object.fromEntries(Object.entries(rawQuery).filter(([, v]) => v !== undefined))
    );

    const { items, nextToken } = await new InvoiceRepository(config.INVOICE_TABLE).list(
        teamId,
        query
    );
    return ok({ invoices: items, nextToken, total: items.length });
};

export const handler = createHandler(lambdaHandler);
