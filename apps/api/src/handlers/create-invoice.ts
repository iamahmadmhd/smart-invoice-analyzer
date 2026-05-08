import { getUserContext, parseBody } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { CreateInvoiceRequestSchema, Invoice } from '@smart-invoice-analyzer/contracts';
import { InvoiceRepository } from '@smart-invoice-analyzer/data-access';
import { generateInvoiceId } from '@smart-invoice-analyzer/domain';
import { withObservability } from '@smart-invoice-analyzer/observability';
import { created } from '../utils/response';

const handler = withObservability(async (event) => {
    const user = getUserContext(event as never);
    const body = parseBody(event as never, CreateInvoiceRequestSchema);
    const config = getConfig();

    const invoiceId = generateInvoiceId();
    const now = new Date().toISOString();

    const invoice: Invoice = {
        invoiceId,
        userId: user.userId,
        sourceFileId: body.sourceFileId,
        status: 'UPLOADED',
        exportStatus: 'NOT_EXPORTED',
        currency: 'EUR',
        duplicateFlag: false,
        anomalyFlag: false,
        createdAt: now,
        updatedAt: now,
    };

    const repo = new InvoiceRepository(config.INVOICE_TABLE);
    await repo.put(invoice);

    return created({ invoiceId, status: invoice.status });
});

export { handler };
