import { getConfig, getS3Config } from '@smart-invoice-analyzer/config';
import { ExportWorkerEventSchema } from '@smart-invoice-analyzer/contracts';
import {
    ExportRepository,
    InvoiceRepository,
    S3Repository,
} from '@smart-invoice-analyzer/data-access';
import { validateInvoicesForExport } from '@smart-invoice-analyzer/domain';
import { generateCsv, generateZipArchive } from '@smart-invoice-analyzer/export';
import type { SQSRecord } from 'aws-lambda';
import { logger } from '../powertools';
import { parseRecord, processor, processPartialResponse } from '../utils/parse-event';

async function recordHandler(record: SQSRecord): Promise<void> {
    const payload = parseRecord(record.body, ExportWorkerEventSchema);
    logger.appendKeys({
        correlationId: payload.correlationId,
        exportId: payload.exportId,
    });

    const config = getConfig();
    const s3Config = getS3Config(config);

    const batchRepo = new ExportRepository(config.EXPORT_TABLE);
    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);
    const s3 = new S3Repository(config.BUCKET_NAME);

    logger.info('Export worker started');

    await batchRepo.updateStatus(payload.teamId, payload.exportId, 'GENERATING');

    const batch = await batchRepo.getById(payload.teamId, payload.exportId);

    const invoices = await invoiceRepo.listEligibleForExport(
        payload.teamId,
        batch.periodStart,
        batch.periodEnd
    );

    if (invoices.length === 0) {
        logger.warn('No eligible invoices for export');
        await batchRepo.updateStatus(payload.teamId, payload.exportId, 'FAILED');
        return;
    }

    const report = validateInvoicesForExport(invoices);
    if (!report.canProceed) {
        logger.warn('Export validation failed at generation time', { errors: report.errors });
        await batchRepo.updateStatus(payload.teamId, payload.exportId, 'FAILED');
        return;
    }

    const csv = generateCsv(invoices, batch, {
        includeDocumentReferences: payload.includeDocumentReferences ?? false,
        bucketName: config.BUCKET_NAME,
        invoicePrefix: s3Config.invoicePrefix,
    });

    const zip = await generateZipArchive(batch, csv);

    await s3.putObject(zip.s3Key, zip.buffer, 'application/zip');

    await Promise.all(
        invoices.map((inv) =>
            invoiceRepo.markExported(payload.teamId, inv.invoiceId, payload.exportId)
        )
    );

    await batchRepo.updateStatus(payload.teamId, payload.exportId, 'COMPLETED', {
        archiveS3Key: zip.s3Key,
        completedAt: new Date().toISOString(),
    });

    logger.info('Export worker completed', {
        invoiceCount: invoices.length,
        archiveS3Key: zip.s3Key,
    });
}

export const handler = async (event: { Records: SQSRecord[] }) =>
    processPartialResponse(event as never, recordHandler, processor);
