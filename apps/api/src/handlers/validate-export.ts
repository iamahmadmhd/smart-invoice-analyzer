import {
    assertActiveMembership,
    parseBody,
    requireRole,
    resolveRawTeamRequest,
} from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { Export, ValidateExportRequestSchema } from '@smart-invoice-analyzer/contracts';
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
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { created } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const body = parseBody(event, ValidateExportRequestSchema);
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

    const exportId = generateExportId();
    const now = new Date().toISOString();

    const exportRecord: Export = {
        exportId,
        teamId,
        createdBy: userId,
        periodStart,
        periodEnd,
        format: 'CSV',
        status: report.canProceed ? 'READY' : 'FAILED',
        validationReport: report,
        createdAt: now,
    };

    const exportRepo = new ExportRepository(config.EXPORT_TABLE);
    await exportRepo.put(exportRecord);

    return created({ exportId, report });
};

export const handler = createHandler(lambdaHandler);
