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
    ProcessingJobRepository,
} from '@smart-invoice-analyzer/data-access';
import { ConflictError } from '@smart-invoice-analyzer/errors';
import { ApiResponse, createHandler, logger, ParsedApiEvent } from '../powertools';
import { noContent } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const invoiceId = requirePathParam(event, 'invoiceId');
    const config = getConfig();

    const membership = await new MembershipRepository(config.MEMBERSHIP_TABLE).findByIds(
        teamId,
        userId
    );
    assertActiveMembership(membership, teamId, userId);

    const invoice = await new InvoiceRepository(config.INVOICE_TABLE).getById(teamId, invoiceId);

    if (invoice.exportStatus === 'EXPORTED') {
        throw new ConflictError('Cannot delete an invoice that has already been exported', {
            invoiceId,
            exportId: invoice.exportId,
        });
    }

    await Promise.all([
        new InsightRepository(config.INSIGHT_TABLE).deleteAllForInvoice(invoiceId),
        new ProcessingJobRepository(config.PROCESSING_JOB_TABLE).deleteAllForInvoice(invoiceId),
    ]);

    await new InvoiceRepository(config.INVOICE_TABLE).deleteById(teamId, invoiceId);
    logger.info('Invoice deleted', { invoiceId, teamId, userId });

    return noContent();
};

export const handler = createHandler(lambdaHandler);
