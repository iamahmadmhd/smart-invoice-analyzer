import { randomUUID } from 'crypto';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { getUserContext, parseBody, requirePathParam } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { UpdateInvoiceRequestSchema } from '@smart-invoice-analyzer/contracts';
import {
    InsightRepository,
    InvoiceRepository,
    ProcessingJobRepository,
} from '@smart-invoice-analyzer/data-access';
import { generateJobId } from '@smart-invoice-analyzer/domain';
import { ConflictError, NotFoundError } from '@smart-invoice-analyzer/errors';
import { logger, withApiHandler } from '../powertools';
import { ok } from '../utils/response';
import { sendToQueue } from '../utils/sqs';

/** Statuses where OCR + enrichment have already run — safe to re-trigger detection. */
const REPROCESSABLE_STATUSES = new Set(['ENRICHED', 'REVIEW_READY', 'COMPLETED']);

const handler = withApiHandler(async (event) => {
    const user = getUserContext(event as never);
    const invoiceId = requirePathParam(event as never, 'invoiceId');
    const body = parseBody(event as never, UpdateInvoiceRequestSchema);
    const config = getConfig();

    const repo = new InvoiceRepository(config.INVOICE_TABLE);
    const invoice = await repo.getById(user.userId, invoiceId);

    if (!invoice) {
        throw new NotFoundError('Invoice', invoiceId);
    }

    if (invoice.exportStatus === 'EXPORTED') {
        throw new ConflictError('Cannot edit an invoice that has already been exported', {
            invoiceId,
            exportStatus: invoice.exportStatus,
        });
    }

    const now = new Date().toISOString();
    const updated = {
        ...invoice,
        ...body,
        // Immutable fields — never overwritten by user input
        invoiceId: invoice.invoiceId,
        userId: invoice.userId,
        status: invoice.status,
        exportStatus: invoice.exportStatus,
        exportBatchId: invoice.exportBatchId,
        exportedAt: invoice.exportedAt,
        duplicateFlag: invoice.duplicateFlag,
        anomalyFlag: invoice.anomalyFlag,
        confidenceScore: invoice.confidenceScore,
        sourceFileId: invoice.sourceFileId,
        createdAt: invoice.createdAt,
        updatedAt: now,
    };

    // ── Tax recalculation ─────────────────────────────────────────────────
    const effectiveNet = body.netAmount ?? invoice.netAmount;
    const effectiveTaxRate = body.taxRate ?? invoice.taxRate;

    if (
        effectiveNet !== undefined &&
        effectiveTaxRate !== undefined &&
        body.taxAmount === undefined
    ) {
        updated.taxAmount = parseFloat(((effectiveNet * effectiveTaxRate) / 100).toFixed(2));
    }

    const effectiveTax = updated.taxAmount ?? invoice.taxAmount;
    const effectiveNet2 = updated.netAmount ?? invoice.netAmount;
    if (
        effectiveNet2 !== undefined &&
        effectiveTax !== undefined &&
        body.totalAmount === undefined
    ) {
        updated.totalAmount = parseFloat((effectiveNet2 + effectiveTax).toFixed(2));
    }

    await repo.put(updated);

    if (REPROCESSABLE_STATUSES.has(invoice.status) && config.ENRICHMENT_QUEUE_URL) {
        const insightRepo = new InsightRepository(config.INSIGHT_TABLE);
        await insightRepo.deleteByTypesForInvoice(invoiceId, ['SUMMARY', 'DUPLICATE', 'ANOMALY']);

        await repo.put({ ...updated, duplicateFlag: false, anomalyFlag: false });

        const jobId = generateJobId();
        const correlationId = randomUUID();

        const jobRepo = new ProcessingJobRepository(config.PROCESSING_JOB_TABLE);
        await jobRepo.put({
            jobId,
            invoiceId,
            userId: user.userId,
            stage: 'ENRICHMENT',
            status: 'PENDING',
            retryCount: 0,
            startedAt: now,
        });

        await sendToQueue(config.ENRICHMENT_QUEUE_URL, {
            invoiceId,
            userId: user.userId,
            jobId,
            correlationId,
            attempt: 1,
            rawOutputS3Key: `${config.DERIVED_PREFIX}${user.userId}/${invoiceId}/ocr.json`,
        });

        logger.info('Re-triggered enrichment pipeline after invoice update', { invoiceId, jobId });
    }

    return ok(updated);
});

export { handler };
