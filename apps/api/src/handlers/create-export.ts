import { randomUUID } from 'crypto';
import {
    assertActiveMembership,
    parseBody,
    requireRole,
    resolveRawTeamRequest,
} from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import {
    CreateExportRequestSchema,
    Export,
    ExportWorkerEvent,
} from '@smart-invoice-analyzer/contracts';
import {
    ExportRepository,
    InvoiceRepository,
    MembershipRepository,
} from '@smart-invoice-analyzer/data-access';
import {
    generateExportId,
    resolvePeriod,
    validateInvoicesForExport,
} from '@smart-invoice-analyzer/domain';
import { ConflictError } from '@smart-invoice-analyzer/errors';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { created } from '../utils/response';
import { sendToQueue } from '../utils/sqs';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const body = parseBody(event, CreateExportRequestSchema);
    const config = getConfig();

    const membership = await new MembershipRepository(config.MEMBERSHIP_TABLE).findByIds(
        teamId,
        userId
    );
    assertActiveMembership(membership, teamId, userId);
    requireRole(membership, 'MEMBER');

    const { periodStart, periodEnd } = resolvePeriod(body.period);
    const invoices = await new InvoiceRepository(config.INVOICE_TABLE).listEligibleForExport(
        teamId,
        periodStart,
        periodEnd
    );
    const report = validateInvoicesForExport(invoices);

    if (!report.canProceed) {
        throw new ConflictError('Export validation failed — resolve errors before generating', {
            errors: report.errors,
        });
    }

    const exportId = generateExportId();
    const now = new Date().toISOString();

    const exportRecord: Export = {
        exportId,
        teamId,
        createdBy: userId,
        periodStart,
        periodEnd,
        format: 'CSV',
        status: 'PENDING',
        validationReport: report,
        createdAt: now,
    };

    await new ExportRepository(config.EXPORT_TABLE).put(exportRecord);

    const workerEvent: ExportWorkerEvent = {
        exportId,
        teamId,
        createdBy: userId,
        correlationId: randomUUID(),
        includeDocumentReferences: body.includeDocumentReferences ?? false,
    };
    await sendToQueue(config.EXPORT_QUEUE_URL, workerEvent);

    return created({ exportId, status: 'PENDING' });
};

export const handler = createHandler(lambdaHandler);
