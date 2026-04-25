import { getConfig } from '@smart-invoice-analyzer/config';
import { DuplicateEventSchema, Insight } from '@smart-invoice-analyzer/contracts';
import {
    InsightRepository,
    InvoiceRepository,
    ProcessingJobRepository,
} from '@smart-invoice-analyzer/data-access';
import { checkForDuplicate, generateInsightId } from '@smart-invoice-analyzer/domain';
import { logger, setCorrelationId } from '@smart-invoice-analyzer/observability';
import { parseWorkerEvent, SQSEvent } from '../utils/parse-event';
import { sendToQueue } from '../utils/sqs';

export const handler = async (event: SQSEvent): Promise<void> => {
    const payload = parseWorkerEvent(event, DuplicateEventSchema);
    setCorrelationId(payload.correlationId);

    const config = getConfig();
    const jobRepo = new ProcessingJobRepository(config.PROCESSING_JOB_TABLE);
    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);
    const insightRepo = new InsightRepository(config.INSIGHT_TABLE);

    logger.info('Duplicate detection started', { invoiceId: payload.invoiceId });

    try {
        await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'IN_PROGRESS');

        const invoice = await invoiceRepo.getById(payload.userId, payload.invoiceId);

        // Fetch recent completed invoices for comparison
        const { items: recentInvoices } = await invoiceRepo.list(payload.userId, {
            status: 'COMPLETED',
            limit: 100,
        });

        const result = checkForDuplicate(invoice, recentInvoices);

        if (result.isDuplicate) {
            const updatedInvoice = {
                ...invoice,
                duplicateFlag: true,
                updatedAt: new Date().toISOString(),
            };
            await invoiceRepo.put(updatedInvoice);

            const insight: Insight = {
                insightId: generateInsightId(),
                userId: payload.userId,
                invoiceId: payload.invoiceId,
                type: 'DUPLICATE',
                payload: {
                    duplicateOfInvoiceId: result.duplicateOfInvoiceId,
                    reason: result.reason,
                },
                createdAt: new Date().toISOString(),
            };
            await insightRepo.put(insight);

            logger.warn('Duplicate detected', {
                invoiceId: payload.invoiceId,
                duplicateOf: result.duplicateOfInvoiceId,
            });
        }

        await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'COMPLETED');

        await sendToQueue(config.ANOMALY_QUEUE_URL!, {
            invoiceId: payload.invoiceId,
            userId: payload.userId,
            jobId: payload.jobId,
            correlationId: payload.correlationId,
            attempt: payload.attempt,
        });

        logger.info('Duplicate detection completed', {
            invoiceId: payload.invoiceId,
            isDuplicate: result.isDuplicate,
        });
    } catch (error) {
        logger.error('Duplicate detection failed', {
            invoiceId: payload.invoiceId,
            error: String(error),
        });
        await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'FAILED', {
            code: 'DUPLICATE_ERROR',
            message: String(error),
        });
        throw error;
    }
};
