import { randomUUID } from 'crypto';
import {
    assertActiveMembership,
    parseBody,
    requirePathParam,
    resolveRawTeamRequest,
} from '@vault/auth';
import { getConfig } from '@vault/config';
import { UpdateInvoiceRequestSchema } from '@vault/contracts';
import {
    InsightRepository,
    InvoiceRepository,
    MembershipRepository,
    ProcessingJobRepository,
} from '@vault/data-access';
import { generateJobId } from '@vault/domain';
import { ConflictError } from '@vault/errors';
import { ApiResponse, createHandler, logger, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';
import { sendToQueue } from '../utils/sqs';

const REPROCESSABLE = new Set(['ENRICHED', 'REVIEW_READY', 'COMPLETED']);

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const invoiceId = requirePathParam(event, 'invoiceId');
    const body = parseBody(event, UpdateInvoiceRequestSchema);
    const config = getConfig();

    const membership = await new MembershipRepository(config.MEMBERSHIP_TABLE!).findByIds(
        teamId,
        userId
    );
    assertActiveMembership(membership, teamId, userId);

    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);
    const invoice = await invoiceRepo.getById(teamId, invoiceId);

    if (invoice.exportStatus === 'EXPORTED') {
        throw new ConflictError('Cannot edit an invoice that has already been exported', {
            invoiceId,
        });
    }

    const now = new Date().toISOString();
    const updated = {
        ...invoice,
        ...body,
        // Immutable fields
        invoiceId: invoice.invoiceId,
        teamId: invoice.teamId,
        uploadedBy: invoice.uploadedBy,
        status: invoice.status,
        exportStatus: invoice.exportStatus,
        exportId: invoice.exportId,
        exportedAt: invoice.exportedAt,
        duplicateFlag: invoice.duplicateFlag,
        anomalyFlag: invoice.anomalyFlag,
        confidenceScore: invoice.confidenceScore,
        sourceFileId: invoice.sourceFileId,
        createdAt: invoice.createdAt,
        updatedAt: now,
    };

    // Tax recalculation
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

    await invoiceRepo.put(updated);

    if (REPROCESSABLE.has(invoice.status) && config.ENRICHMENT_QUEUE_URL) {
        const insightRepo = new InsightRepository(config.INSIGHT_TABLE);
        await insightRepo.deleteByTypesForInvoice(invoiceId, ['SUMMARY', 'DUPLICATE', 'ANOMALY']);
        await invoiceRepo.put({ ...updated, duplicateFlag: false, anomalyFlag: false });

        const jobId = generateJobId();
        const now2 = new Date().toISOString();
        await new ProcessingJobRepository(config.PROCESSING_JOB_TABLE).put({
            jobId,
            invoiceId,
            teamId,
            uploadedBy: userId,
            stage: 'ENRICHMENT',
            status: 'PENDING',
            retryCount: 0,
            startedAt: now2,
        });

        await sendToQueue(config.ENRICHMENT_QUEUE_URL, {
            invoiceId,
            teamId,
            uploadedBy: userId,
            jobId,
            correlationId: randomUUID(),
            attempt: 1,
            rawOutputS3Key: `${config.DERIVED_PREFIX}${teamId}/${invoiceId}/ocr.json`,
        });

        logger.info('Re-triggered enrichment after invoice update', { invoiceId, jobId });
    }

    return ok(updated);
};

export const handler = createHandler(lambdaHandler);
