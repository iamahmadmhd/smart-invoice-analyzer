import { getConfig, getS3Config } from '@smart-invoice-analyzer/config';
import { ExportWorkerEventSchema } from '@smart-invoice-analyzer/contracts';
import {
    ExportBatchRepository,
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
        exportBatchId: payload.exportBatchId,
    });

    const config = getConfig();
    const s3Config = getS3Config(config);

    const batchRepo = new ExportBatchRepository(config.EXPORT_BATCH_TABLE);
    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);
    const s3 = new S3Repository(config.BUCKET_NAME);

    logger.info('Export worker started');

    await batchRepo.updateStatus(payload.userId, payload.exportBatchId, 'GENERATING');

    const batch = await batchRepo.getById(payload.userId, payload.exportBatchId);

    const invoices = await invoiceRepo.listEligibleForExport(
        payload.userId,
        batch.periodStart,
        batch.periodEnd
    );

    if (invoices.length === 0) {
        logger.warn('No eligible invoices for export');
        await batchRepo.updateStatus(payload.userId, payload.exportBatchId, 'FAILED');
        return;
    }

    const report = validateInvoicesForExport(invoices);
    if (!report.canProceed) {
        logger.warn('Export validation failed at generation time', { errors: report.errors });
        await batchRepo.updateStatus(payload.userId, payload.exportBatchId, 'FAILED');
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
            invoiceRepo.markExported(payload.userId, inv.invoiceId, payload.exportBatchId)
        )
    );

    await batchRepo.updateStatus(payload.userId, payload.exportBatchId, 'COMPLETED', {
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
