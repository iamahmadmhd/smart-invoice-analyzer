import { getConfig } from '@smart-invoice-analyzer/config';
import { DuplicateEventSchema, Insight } from '@smart-invoice-analyzer/contracts';
import {
    InsightRepository,
    InvoiceRepository,
    ProcessingJobRepository,
} from '@smart-invoice-analyzer/data-access';
import { checkForDuplicate, generateInsightId } from '@smart-invoice-analyzer/domain';
import type { SQSRecord } from 'aws-lambda';
import { logger, parseRecord, processor, processPartialResponse } from '../powertools';
import { sendToQueue } from '../utils/sqs';

async function recordHandler(record: SQSRecord): Promise<void> {
    const payload = parseRecord(record.body, DuplicateEventSchema);
    logger.appendKeys({ correlationId: payload.correlationId, invoiceId: payload.invoiceId });

    const config = getConfig();
    const jobRepo = new ProcessingJobRepository(config.PROCESSING_JOB_TABLE);
    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);

    await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'IN_PROGRESS');

    const invoice = await invoiceRepo.getById(payload.teamId, payload.invoiceId);
    const { items: recentInvoices } = await invoiceRepo.list(payload.teamId, {
        status: 'COMPLETED',
        limit: 100,
    });
    const result = checkForDuplicate(invoice, recentInvoices);

    if (result.isDuplicate) {
        await invoiceRepo.put({
            ...invoice,
            duplicateFlag: true,
            updatedAt: new Date().toISOString(),
        });

        const insight: Insight = {
            insightId: generateInsightId(),
            teamId: payload.teamId,
            createdBy: payload.uploadedBy,
            invoiceId: payload.invoiceId,
            type: 'DUPLICATE',
            payload: { duplicateOfInvoiceId: result.duplicateOfInvoiceId, reason: result.reason },
            createdAt: new Date().toISOString(),
        };
        await new InsightRepository(config.INSIGHT_TABLE).put(insight);
        logger.warn('Duplicate detected', { duplicateOf: result.duplicateOfInvoiceId });
    }

    await jobRepo.updateStatus(payload.invoiceId, payload.jobId, 'COMPLETED');

    await sendToQueue(config.ANOMALY_QUEUE_URL!, {
        invoiceId: payload.invoiceId,
        teamId: payload.teamId,
        uploadedBy: payload.uploadedBy,
        jobId: payload.jobId,
        correlationId: payload.correlationId,
        attempt: payload.attempt,
    });

    logger.info('Duplicate detection completed', { isDuplicate: result.isDuplicate });
}

export const handler = async (event: { Records: SQSRecord[] }) =>
    processPartialResponse(event as never, recordHandler, processor);
