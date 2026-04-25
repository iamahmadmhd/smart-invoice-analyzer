import { randomUUID } from 'crypto';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { getUserContext, parseBody } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { CreateExportRequestSchema, ExportWorkerEvent } from '@smart-invoice-analyzer/contracts';
import { ExportBatchRepository, InvoiceRepository } from '@smart-invoice-analyzer/data-access';
import {
    generateExportBatchId,
    resolvePeriod,
    validateInvoicesForExport,
} from '@smart-invoice-analyzer/domain';
import { ConflictError, withObservability } from '@smart-invoice-analyzer/observability';
import { created } from '../utils/response';

const sqs = new SQSClient({});

const handler = withObservability(async (event) => {
    const user = getUserContext(event as never);
    const body = parseBody(event as never, CreateExportRequestSchema);
    const config = getConfig();

    const { periodStart, periodEnd } = resolvePeriod(body.period);

    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);
    const invoices = await invoiceRepo.listEligibleForExport(user.userId, periodStart, periodEnd);

    const report = validateInvoicesForExport(invoices, body.sachkontenlaenge);
    if (!report.canProceed) {
        throw new ConflictError('Export validation failed — resolve errors before generating', {
            errors: report.errors,
        });
    }

    const exportBatchId = generateExportBatchId();
    const now = new Date().toISOString();

    const batchRepo = new ExportBatchRepository(config.EXPORT_BATCH_TABLE);
    await batchRepo.put({
        exportBatchId,
        userId: user.userId,
        periodStart,
        periodEnd,
        format: 'DATEV_EXTF_7',
        beraternummer: body.beraternummer,
        mandantennummer: body.mandantennummer,
        sachkontenrahmen: body.sachkontenrahmen,
        sachkontenlaenge: body.sachkontenlaenge,
        status: 'PENDING',
        validationReport: report,
        createdAt: now,
    });

    const workerEvent: ExportWorkerEvent = {
        exportBatchId,
        userId: user.userId,
        correlationId: randomUUID(),
        includeDocumentReferences: body.includeDocumentReferences ?? false,
    };

    await sqs.send(
        new SendMessageCommand({
            QueueUrl: config.EXPORT_QUEUE_URL,
            MessageBody: JSON.stringify(workerEvent),
        })
    );

    return created({ exportBatchId, status: 'PENDING' });
});

export { handler };
