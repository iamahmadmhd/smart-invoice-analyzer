import { getConfig } from '@smart-invoice-analyzer/config';
import { AnomalyEventSchema, Insight } from '@smart-invoice-analyzer/contracts';
import {
    InsightRepository,
    InvoiceRepository,
    ProcessingJobRepository,
} from '@smart-invoice-analyzer/data-access';
import { checkForAnomalies, generateInsightId } from '@smart-invoice-analyzer/domain';
import { logger, setCorrelationId } from '@smart-invoice-analyzer/observability';
import { parseWorkerEvent, SQSEvent } from '../utils/parse-event';

export const handler = async (event: SQSEvent): Promise<void> => {
    const payload = parseWorkerEvent(event, AnomalyEventSchema);
    setCorrelationId(payload.correlationId);

    const config = getConfig();
    const jobRepo = new ProcessingJobRepository(config.PROCESSING_JOB_TABLE);
    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);
    const insightRepo = new InsightRepository(config.INSIGHT_TABLE);

    logger.info('Anomaly detection started', { invoiceId: payload.invoiceId });

    try {
        await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'IN_PROGRESS');

        const invoice = await invoiceRepo.getById(payload.userId, payload.invoiceId);

        // Fetch recent invoices to compute baseline for amount comparison
        const { items: recentInvoices } = await invoiceRepo.list(payload.userId, { limit: 100 });

        const result = checkForAnomalies(invoice, recentInvoices);

        if (result.isAnomaly) {
            const updatedInvoice = {
                ...invoice,
                anomalyFlag: true,
                updatedAt: new Date().toISOString(),
            };
            await invoiceRepo.put(updatedInvoice);

            const insight: Insight = {
                insightId: generateInsightId(),
                userId: payload.userId,
                invoiceId: payload.invoiceId,
                type: 'ANOMALY',
                payload: { reasons: result.reasons },
                createdAt: new Date().toISOString(),
            };
            await insightRepo.put(insight);

            logger.warn('Anomaly detected', {
                invoiceId: payload.invoiceId,
                reasons: result.reasons,
            });
        }

        // Advance status through REVIEW_READY → COMPLETED
        // If flags are set the mobile app shows them; either way we complete the pipeline
        await invoiceRepo.updateStatus(payload.userId, payload.invoiceId, 'REVIEW_READY');
        await invoiceRepo.updateStatus(payload.userId, payload.invoiceId, 'COMPLETED');
        await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'COMPLETED');

        logger.info('Anomaly detection completed — invoice COMPLETED', {
            invoiceId: payload.invoiceId,
            isAnomaly: result.isAnomaly,
        });
    } catch (error) {
        logger.error('Anomaly detection failed', {
            invoiceId: payload.invoiceId,
            error: String(error),
        });
        await invoiceRepo.updateStatus(payload.userId, payload.invoiceId, 'FAILED_INTERNAL');
        await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'FAILED', {
            code: 'ANOMALY_ERROR',
            message: String(error),
        });
        throw error;
    }
};
