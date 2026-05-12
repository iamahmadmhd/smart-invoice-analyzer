import { getConfig } from '@smart-invoice-analyzer/config';
import { NormalizationEventSchema } from '@smart-invoice-analyzer/contracts';
import {
    InvoiceRepository,
    ProcessingJobRepository,
    S3Repository,
} from '@smart-invoice-analyzer/data-access';
import { mergeOcrParseIntoInvoice, parseOcrText } from '@smart-invoice-analyzer/domain';
import type { SQSRecord } from 'aws-lambda';
import { logger } from '../powertools';
import { parseRecord, processor, processPartialResponse } from '../utils/parse-event';
import { sendToQueue } from '../utils/sqs';

async function recordHandler(record: SQSRecord): Promise<void> {
    const payload = parseRecord(record.body, NormalizationEventSchema);
    logger.appendKeys({ correlationId: payload.correlationId, invoiceId: payload.invoiceId });

    const config = getConfig();
    const jobRepo = new ProcessingJobRepository(config.PROCESSING_JOB_TABLE);
    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);
    const s3 = new S3Repository(config.BUCKET_NAME);

    logger.info('Normalization started');

    await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'IN_PROGRESS');

    const ocrJson = await s3.getObjectAsString(payload.rawOutputS3Key);
    const { rawText } = JSON.parse(ocrJson) as { rawText: string };

    const invoice = await invoiceRepo.getById(payload.userId, payload.invoiceId);

    const parsed = parseOcrText(rawText);
    const patch = mergeOcrParseIntoInvoice(invoice, parsed);

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
        rawOutputS3Key: payload.rawOutputS3Key,
    });

    logger.info('Normalization completed', { patch });
}

export const handler = async (event: { Records: SQSRecord[] }) =>
    processPartialResponse(event as never, recordHandler, processor);
