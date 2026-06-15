import { assertActiveMembership, requirePathParam, resolveRawTeamRequest } from '@vault/auth';
import { getConfig } from '@vault/config';
import { InvoiceRepository, MembershipRepository } from '@vault/data-access';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const invoiceId = requirePathParam(event, 'invoiceId');
    const config = getConfig();

    const membership = await new MembershipRepository(config.MEMBERSHIP_TABLE!).findByIds(
        teamId,
        userId
    );
    assertActiveMembership(membership, teamId, userId);

    const invoice = await new InvoiceRepository(config.INVOICE_TABLE).getById(teamId, invoiceId);
    return ok(invoice);
};

export const handler = createHandler(lambdaHandler);
