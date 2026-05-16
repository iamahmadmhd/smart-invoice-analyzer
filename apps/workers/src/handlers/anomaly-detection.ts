import { getConfig } from '@smart-invoice-analyzer/config';
import { AnomalyEventSchema, Insight } from '@smart-invoice-analyzer/contracts';
import {
    InsightRepository,
    InvoiceRepository,
    ProcessingJobRepository,
} from '@smart-invoice-analyzer/data-access';
import { checkForAnomalies, generateInsightId } from '@smart-invoice-analyzer/domain';
import type { SQSRecord } from 'aws-lambda';
import { logger, parseRecord, processor, processPartialResponse } from '../powertools';

async function recordHandler(record: SQSRecord): Promise<void> {
    const payload = parseRecord(record.body, AnomalyEventSchema);
    logger.appendKeys({ correlationId: payload.correlationId, invoiceId: payload.invoiceId });

    const config = getConfig();
    const jobRepo = new ProcessingJobRepository(config.PROCESSING_JOB_TABLE);
    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);

    await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'IN_PROGRESS');

    const invoice = await invoiceRepo.getById(payload.teamId, payload.invoiceId);
    const { items: recentInvoices } = await invoiceRepo.list(payload.teamId, { limit: 100 });
    const result = checkForAnomalies(invoice, recentInvoices);

    if (result.isAnomaly) {
        await invoiceRepo.put({
            ...invoice,
            anomalyFlag: true,
            updatedAt: new Date().toISOString(),
        });

        const insight: Insight = {
            insightId: generateInsightId(),
            teamId: payload.teamId,
            createdBy: payload.uploadedBy,
            invoiceId: payload.invoiceId,
            type: 'ANOMALY',
            payload: { reasons: result.reasons },
            createdAt: new Date().toISOString(),
        };
        await new InsightRepository(config.INSIGHT_TABLE).put(insight);
        logger.warn('Anomaly detected', { reasons: result.reasons });
    }

    await invoiceRepo.updateStatus(payload.teamId, payload.invoiceId, 'REVIEW_READY');
    await invoiceRepo.updateStatus(payload.teamId, payload.invoiceId, 'COMPLETED');
    await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'COMPLETED');

    logger.info('Anomaly detection completed', { isAnomaly: result.isAnomaly });
}

export const handler = async (event: { Records: SQSRecord[] }) =>
    processPartialResponse(event as never, recordHandler, processor);
