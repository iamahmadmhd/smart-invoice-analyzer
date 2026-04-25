import { extractInvoiceFields, mergeExtractionIntoInvoice } from '@smart-invoice-analyzer/ai';
import { getConfig } from '@smart-invoice-analyzer/config';
import { NormalizationEventSchema } from '@smart-invoice-analyzer/contracts';
import {
    InvoiceRepository,
    ProcessingJobRepository,
    S3Repository,
} from '@smart-invoice-analyzer/data-access';
import { logger, setCorrelationId } from '@smart-invoice-analyzer/observability';
import { parseWorkerEvent, SQSEvent } from '../utils/parse-event';
import { sendToQueue } from '../utils/sqs';

export const handler = async (event: SQSEvent): Promise<void> => {
    const payload = parseWorkerEvent(event, NormalizationEventSchema);
    setCorrelationId(payload.correlationId);

    const config = getConfig();
    const jobRepo = new ProcessingJobRepository(config.PROCESSING_JOB_TABLE);
    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);
    const s3 = new S3Repository(config.BUCKET_NAME);

    logger.info('Normalization started', { invoiceId: payload.invoiceId });

    try {
        await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'IN_PROGRESS');

        const ocrJson = await s3.getObjectAsString(payload.rawOutputS3Key);
        const { rawText } = JSON.parse(ocrJson) as { rawText: string };

        const invoice = await invoiceRepo.getById(payload.userId, payload.invoiceId);
        const extraction = await extractInvoiceFields(rawText);
        const patch = mergeExtractionIntoInvoice(invoice, extraction);

        // Apply patch by putting updated invoice
        const updated = { ...invoice, ...patch, updatedAt: new Date().toISOString() };
        await invoiceRepo.put(updated);
        await invoiceRepo.updateStatus(payload.userId, payload.invoiceId, 'EXTRACTED');
        await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'COMPLETED');

        await sendToQueue(config.ENRICHMENT_QUEUE_URL!, {
            invoiceId: payload.invoiceId,
            userId: payload.userId,
            jobId: payload.jobId,
            correlationId: payload.correlationId,
            attempt: payload.attempt,
        });

        logger.info('Normalization completed', { invoiceId: payload.invoiceId, patch });
    } catch (error) {
        logger.error('Normalization failed', {
            invoiceId: payload.invoiceId,
            error: String(error),
        });
        await invoiceRepo.updateStatus(payload.userId, payload.invoiceId, 'FAILED_VALIDATION');
        await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'FAILED', {
            code: 'NORMALIZATION_ERROR',
            message: String(error),
        });
        throw error;
    }
};
