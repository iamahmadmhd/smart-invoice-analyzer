import { getConfig } from '@smart-invoice-analyzer/config';
import { NormalizationEventSchema } from '@smart-invoice-analyzer/contracts';
import {
    InvoiceRepository,
    ProcessingJobRepository,
    S3Repository,
} from '@smart-invoice-analyzer/data-access';
import { mergeOcrParseIntoInvoice, parseOcrText } from '@smart-invoice-analyzer/domain';
import type { SQSRecord } from 'aws-lambda';
import { logger, parseRecord, processor, processPartialResponse } from '../powertools';
import { sendToQueue } from '../utils/sqs';

async function recordHandler(record: SQSRecord): Promise<void> {
    const payload = parseRecord(record.body, NormalizationEventSchema);
    logger.appendKeys({ correlationId: payload.correlationId, invoiceId: payload.invoiceId });

    const config = getConfig();
    const jobRepo = new ProcessingJobRepository(config.PROCESSING_JOB_TABLE);
    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);

    await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'IN_PROGRESS');

    const ocrJson = await new S3Repository(config.BUCKET_NAME).getObjectAsString(
        payload.rawOutputS3Key
    );
    const { rawText } = JSON.parse(ocrJson) as { rawText: string };

    const invoice = await invoiceRepo.getById(payload.teamId, payload.invoiceId);
    const patch = mergeOcrParseIntoInvoice(invoice, parseOcrText(rawText));

    await invoiceRepo.put({ ...invoice, ...patch, updatedAt: new Date().toISOString() });
    await invoiceRepo.updateStatus(payload.teamId, payload.invoiceId, 'EXTRACTED');
    await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'COMPLETED');

    await sendToQueue(config.ENRICHMENT_QUEUE_URL!, {
        invoiceId: payload.invoiceId,
        teamId: payload.teamId,
        uploadedBy: payload.uploadedBy,
        jobId: payload.jobId,
        correlationId: payload.correlationId,
        attempt: payload.attempt,
        rawOutputS3Key: payload.rawOutputS3Key,
    });

    logger.info('Normalization completed', { patch });
}

export const handler = async (event: { Records: SQSRecord[] }) =>
    processPartialResponse(event as never, recordHandler, processor);
