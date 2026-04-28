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
import { logger, setCorrelationId } from '@smart-invoice-analyzer/observability';
import { parseWorkerEvent, SQSEvent } from '../utils/parse-event';
import { sendToQueue } from '../utils/sqs';

export const handler = async (event: SQSEvent): Promise<void> => {
    const payload = parseWorkerEvent(event, EnrichmentEventSchema);
    setCorrelationId(payload.correlationId);

    const config = getConfig();
    const jobRepo = new ProcessingJobRepository(config.PROCESSING_JOB_TABLE);
    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);
    const insightRepo = new InsightRepository(config.INSIGHT_TABLE);
    const s3 = new S3Repository(config.BUCKET_NAME);

    logger.info('Enrichment started', { invoiceId: payload.invoiceId });

    try {
        await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'IN_PROGRESS');

        const invoice = await invoiceRepo.getById(payload.userId, payload.invoiceId);

        // Load OCR text — single Bedrock call covers gap-fill + category + confidence + summary
        const ocrJson = await s3.getObjectAsString(payload.rawOutputS3Key);
        const { rawText } = JSON.parse(ocrJson) as { rawText: string };

        const enrichment = await enrichInvoice(invoice, rawText);

        // Persist summary as an insight
        const insight: Insight = {
            insightId: generateInsightId(),
            userId: payload.userId,
            invoiceId: payload.invoiceId,
            type: 'SUMMARY',
            payload: { summary: enrichment.summary },
            createdAt: new Date().toISOString(),
        };
        await insightRepo.put(insight);

        // Apply gap-fills and enrichment metadata to the invoice
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
            invoiceId: payload.invoiceId,
            insightId: insight.insightId,
            confidenceScore: enrichment.confidenceScore,
        });
    } catch (error) {
        logger.error('Enrichment failed', { invoiceId: payload.invoiceId, error: String(error) });
        await invoiceRepo.updateStatus(payload.userId, payload.invoiceId, 'FAILED_AI');
        await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'FAILED', {
            code: 'ENRICHMENT_ERROR',
            message: String(error),
        });
        throw error;
    }
};
