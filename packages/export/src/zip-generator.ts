import { ExportBatch } from '@smart-invoice-analyzer/contracts';
import { logger } from '@smart-invoice-analyzer/observability';
import JSZip from 'jszip';
import { GeneratedCsv } from './csv-generator';

export interface GeneratedZip {
    buffer: Buffer;
    s3Key: string;
    filename: string;
}

export async function generateZipArchive(
    batch: ExportBatch,
    csv: GeneratedCsv
): Promise<GeneratedZip> {
    logger.info('Generating ZIP archive', {
        exportBatchId: batch.exportBatchId,
        csvFilename: csv.filename,
    });

    const zip = new JSZip();

    zip.file(csv.filename, csv.buffer);
    zip.file('README.txt', buildReadme(batch, csv));

    const buffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
    });

    const filename = buildZipFilename(batch);
    const s3Key = buildS3Key(batch);

    logger.info('ZIP archive generated', {
        exportBatchId: batch.exportBatchId,
        sizeBytes: buffer.length,
        s3Key,
    });

    return { buffer, s3Key, filename };
}

function buildZipFilename(batch: ExportBatch): string {
    const period = batch.periodStart.slice(0, 7).replace('-', '_');
    return `InvoiceExport_${period}_${batch.exportBatchId}.zip`;
}

function buildS3Key(batch: ExportBatch): string {
    return `exports/${batch.userId}/${batch.exportBatchId}.zip`;
}

function buildReadme(batch: ExportBatch, csv: GeneratedCsv): string {
    return [
        'Invoice CSV Export',
        '==================',
        '',
        `Export Batch ID : ${batch.exportBatchId}`,
        `Period          : ${batch.periodStart} – ${batch.periodEnd}`,
        `Invoices        : ${csv.rowCount}`,
        `Created at      : ${new Date().toISOString()}`,
        '',
        'Included Files',
        '--------------',
        `  ${csv.filename}  — Invoice export (CSV, UTF-8 with BOM)`,
        '',
        'Format',
        '------',
        'The CSV file uses comma as the delimiter and UTF-8 encoding with BOM,',
        'so it can be opened directly in Excel, Google Sheets, or any standard',
        'spreadsheet application.',
    ].join('\n');
}
