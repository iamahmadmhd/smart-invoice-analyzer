import { enrichInvoice, mergeEnrichmentIntoInvoice } from '@smart-invoice-analyzer/ai';
import { getConfig } from '@smart-invoice-analyzer/config';
import { EnrichmentEventSchema, Insight } from '@smart-invoice-analyzer/contracts';
import {
    InsightRepository,
    InvoiceRepository,
    ProcessingJobRepository,
    S3Repository,
} from '@smart-invoice-analyzer/data-access';
import { generateInsightId } from '@smart-invoice-analyzer/domain';
import type { SQSRecord } from 'aws-lambda';
import { logger } from '../powertools';
import { parseRecord, processor, processPartialResponse } from '../utils/parse-event';
import { sendToQueue } from '../utils/sqs';

async function recordHandler(record: SQSRecord): Promise<void> {
    const payload = parseRecord(record.body, EnrichmentEventSchema);
    logger.appendKeys({ correlationId: payload.correlationId, invoiceId: payload.invoiceId });

    const config = getConfig();
    const jobRepo = new ProcessingJobRepository(config.PROCESSING_JOB_TABLE);
    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);
    const insightRepo = new InsightRepository(config.INSIGHT_TABLE);
    const s3 = new S3Repository(config.BUCKET_NAME);

    logger.info('Enrichment started');

    await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'IN_PROGRESS');

    const invoice = await invoiceRepo.getById(payload.userId, payload.invoiceId);

    const ocrJson = await s3.getObjectAsString(payload.rawOutputS3Key);
    const { rawText } = JSON.parse(ocrJson) as { rawText: string };

    const enrichment = await enrichInvoice(invoice, rawText);

    const insight: Insight = {
        insightId: generateInsightId(),
        userId: payload.userId,
        invoiceId: payload.invoiceId,
        type: 'SUMMARY',
        payload: { summary: enrichment.summary },
        createdAt: new Date().toISOString(),
    };
    await insightRepo.put(insight);

    const patch = mergeEnrichmentIntoInvoice(invoice, enrichment);
    const updated = { ...invoice, ...patch, updatedAt: new Date().toISOString() };
    await invoiceRepo.put(updated);

    await invoiceRepo.updateStatus(payload.userId, payload.invoiceId, 'ENRICHED');
    await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'COMPLETED');

    await sendToQueue(config.DUPLICATE_QUEUE_URL!, {
        invoiceId: payload.invoiceId,
        userId: payload.userId,
        jobId: payload.jobId,
        correlationId: payload.correlationId,
        attempt: payload.attempt,
    });

    logger.info('Enrichment completed', {
        insightId: insight.insightId,
        confidenceScore: enrichment.confidenceScore,
    });
}

export const handler = async (event: { Records: SQSRecord[] }) =>
    processPartialResponse(event as never, recordHandler, processor);
