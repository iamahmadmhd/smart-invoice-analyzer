import { getUserContext, parseBody } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { ValidateExportRequestSchema } from '@smart-invoice-analyzer/contracts';
import { ExportBatchRepository, InvoiceRepository } from '@smart-invoice-analyzer/data-access';
import {
    generateExportBatchId,
    resolvePeriod,
    validateInvoicesForExport,
} from '@smart-invoice-analyzer/domain';
import { withObservability } from '@smart-invoice-analyzer/observability';
import { created } from '../utils/response';

const handler = withObservability(async (event) => {
    const user = getUserContext(event as never);
    const body = parseBody(event as never, ValidateExportRequestSchema);
    const config = getConfig();

    const { periodStart, periodEnd } = resolvePeriod(body.period);

    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);
    const invoices = await invoiceRepo.listEligibleForExport(user.userId, periodStart, periodEnd);

    const report = validateInvoicesForExport(invoices, body.sachkontenlaenge);

    // Create a PENDING batch so the user can confirm → create-export
    const exportBatchId = generateExportBatchId();
    const now = new Date().toISOString();

    const batchRepo = new ExportBatchRepository(config.EXPORT_BATCH_TABLE);
    await batchRepo.put({
        exportBatchId,
        userId: user.userId,
        periodStart,
        periodEnd,
        format: 'DATEV_EXTF_7',
        beraternummer: body.beraternummer,
        mandantennummer: body.mandantennummer,
        sachkontenrahmen: body.sachkontenrahmen,
        sachkontenlaenge: body.sachkontenlaenge,
        status: 'VALIDATING',
        validationReport: report,
        createdAt: now,
    });

    await batchRepo.updateStatus(
        user.userId,
        exportBatchId,
        report.canProceed ? 'READY' : 'FAILED',
        {
            validationReport: report,
        }
    );

    return created({ exportBatchId, report });
});

export { handler };
