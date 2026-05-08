import { getUserContext, parseBody, requirePathParam } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { UpdateInvoiceRequestSchema } from '@smart-invoice-analyzer/contracts';
import { InvoiceRepository } from '@smart-invoice-analyzer/data-access';
import {
    ConflictError,
    NotFoundError,
    withObservability,
} from '@smart-invoice-analyzer/observability';
import { ok } from '../utils/response';

const handler = withObservability(async (event) => {
    const user = getUserContext(event as never);
    const invoiceId = requirePathParam(event as never, 'invoiceId');
    const body = parseBody(event as never, UpdateInvoiceRequestSchema);
    const config = getConfig();

    const repo = new InvoiceRepository(config.INVOICE_TABLE);
    const invoice = await repo.getById(user.userId, invoiceId);

    if (!invoice) {
        throw new NotFoundError('Invoice', invoiceId);
    }

    // Prevent editing exported invoices
    if (invoice.exportStatus === 'EXPORTED') {
        throw new ConflictError('Cannot edit an invoice that has already been exported', {
            invoiceId,
            exportStatus: invoice.exportStatus,
        });
    }

    const now = new Date().toISOString();
    const updated = {
        ...invoice,
        ...body,
        // These fields must never be overwritten by user input
        invoiceId: invoice.invoiceId,
        userId: invoice.userId,
        status: invoice.status,
        exportStatus: invoice.exportStatus,
        exportBatchId: invoice.exportBatchId,
        exportedAt: invoice.exportedAt,
        duplicateFlag: invoice.duplicateFlag,
        anomalyFlag: invoice.anomalyFlag,
        confidenceScore: invoice.confidenceScore,
        sourceFileId: invoice.sourceFileId,
        createdAt: invoice.createdAt,
        updatedAt: now,
    };

    await repo.put(updated);

    return ok(updated);
});

export { handler };
