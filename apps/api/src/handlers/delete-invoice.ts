import { getUserContext, requirePathParam } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import {
    ExportBatchRepository,
    InsightRepository,
    InvoiceRepository,
    ProcessingJobRepository,
} from '@smart-invoice-analyzer/data-access';
import { ConflictError, logger, withObservability } from '@smart-invoice-analyzer/observability';
import { noContent } from '../utils/response';

const handler = withObservability(async (event) => {
    const user = getUserContext(event as never);
    const invoiceId = requirePathParam(event as never, 'invoiceId');
    const config = getConfig();

    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);
    const invoice = await invoiceRepo.getById(user.userId, invoiceId);

    // Prevent deleting exported invoices — would break accounting trail
    if (invoice.exportStatus === 'EXPORTED') {
        throw new ConflictError('Cannot delete an invoice that has already been exported', {
            invoiceId,
            exportBatchId: invoice.exportBatchId,
        });
    }

    logger.info('Deleting invoice and related data', { invoiceId, userId: user.userId });

    // Cascade: delete insights and processing jobs for this invoice
    const insightRepo = new InsightRepository(config.INSIGHT_TABLE);
    const jobRepo = new ProcessingJobRepository(config.PROCESSING_JOB_TABLE);
    const exportBatchRepo = new ExportBatchRepository(config.EXPORT_BATCH_TABLE);

    await Promise.all([
        insightRepo.deleteAllForInvoice(invoiceId),
        jobRepo.deleteAllForInvoice(invoiceId),
    ]);

    // Finally delete the invoice itself
    await invoiceRepo.deleteById(user.userId, invoiceId);

    logger.info('Invoice deleted', { invoiceId, userId: user.userId });

    return noContent();
});

export { handler };
