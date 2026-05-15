import {
    assertActiveMembership,
    requirePathParam,
    resolveRawTeamRequest,
} from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import {
    InsightRepository,
    InvoiceRepository,
    MembershipRepository,
} from '@smart-invoice-analyzer/data-access';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const invoiceId = requirePathParam(event, 'invoiceId');
    const config = getConfig();

    const membership = await new MembershipRepository(config.MEMBERSHIP_TABLE).findByIds(
        teamId,
        userId
    );
    assertActiveMembership(membership, teamId, userId);

    // Verify invoice belongs to team before returning insights
    await new InvoiceRepository(config.INVOICE_TABLE).getById(teamId, invoiceId);

    const insights = await new InsightRepository(config.INSIGHT_TABLE).listByInvoice(invoiceId);
    return ok({ insights });
};

export const handler = createHandler(lambdaHandler);
