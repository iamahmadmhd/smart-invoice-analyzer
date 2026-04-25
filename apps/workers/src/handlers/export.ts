import { getConfig, getS3Config } from '@smart-invoice-analyzer/config';
import { ExportWorkerEventSchema } from '@smart-invoice-analyzer/contracts';
import {
    ExportBatchRepository,
    InvoiceRepository,
    S3Repository,
} from '@smart-invoice-analyzer/data-access';
import { generateDatevCsv, generateZipArchive } from '@smart-invoice-analyzer/export';
import { logger, setCorrelationId } from '@smart-invoice-analyzer/observability';
import { parseWorkerEvent, SQSEvent } from '../utils/parse-event';

export const handler = async (event: SQSEvent): Promise<void> => {
    const payload = parseWorkerEvent(event, ExportWorkerEventSchema);
    setCorrelationId(payload.correlationId);

    const config = getConfig();
    const s3Config = getS3Config(config);

    const batchRepo = new ExportBatchRepository(config.EXPORT_BATCH_TABLE);
    const invoiceRepo = new InvoiceRepository(config.INVOICE_TABLE);
    const s3 = new S3Repository(config.BUCKET_NAME);

    logger.info('Export worker started', { exportBatchId: payload.exportBatchId });

    try {
        await batchRepo.updateStatus(payload.userId, payload.exportBatchId, 'GENERATING');

        const batch = await batchRepo.getById(payload.userId, payload.exportBatchId);

        // Load eligible invoices for the period
        const invoices = await invoiceRepo.listEligibleForExport(
            payload.userId,
            batch.periodStart,
            batch.periodEnd
        );

        if (invoices.length === 0) {
            logger.warn('No eligible invoices for export', {
                exportBatchId: payload.exportBatchId,
            });
            await batchRepo.updateStatus(payload.userId, payload.exportBatchId, 'FAILED');
            return;
        }

        // Generate DATEV CSV
        const csv = generateDatevCsv(batch, invoices, {
            encoding: 'utf-8-bom',
            includeDocumentReferences: payload.includeDocumentReferences ?? false,
            bucketName: config.BUCKET_NAME,
            invoicePrefix: s3Config.invoicePrefix,
        });

        // Package into ZIP
        const zip = await generateZipArchive(batch, csv);

        // Store archive in S3
        await s3.putObject(zip.s3Key, zip.buffer, 'application/zip');

        // Mark each invoice as exported
        await Promise.all(
            invoices.map((inv) =>
                invoiceRepo.markExported(payload.userId, inv.invoiceId, payload.exportBatchId)
            )
        );

        // Complete the batch
        await batchRepo.updateStatus(payload.userId, payload.exportBatchId, 'COMPLETED', {
            archiveS3Key: zip.s3Key,
            completedAt: new Date().toISOString(),
        });

        logger.info('Export worker completed', {
            exportBatchId: payload.exportBatchId,
            invoiceCount: invoices.length,
            archiveS3Key: zip.s3Key,
        });
    } catch (error) {
        logger.error('Export worker failed', {
            exportBatchId: payload.exportBatchId,
            error: String(error),
        });
        await batchRepo.updateStatus(payload.userId, payload.exportBatchId, 'FAILED');
        throw error;
    }
};
