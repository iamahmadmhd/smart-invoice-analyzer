import { Logger } from '@aws-lambda-powertools/logger';
import { Export } from '@smart-invoice-analyzer/contracts';
import JSZip from 'jszip';
import { GeneratedCsv } from './csv-generator';

const logger = new Logger({ serviceName: 'smart-invoice-analyzer-export' });

export interface GeneratedZip {
    buffer: Buffer;
    s3Key: string;
    filename: string;
}

export async function generateZipArchive(
    exportRecord: Export,
    csv: GeneratedCsv
): Promise<GeneratedZip> {
    logger.info('Generating ZIP archive', {
        exportId: exportRecord.exportId,
        csvFilename: csv.filename,
    });

    const zip = new JSZip();
    zip.file(csv.filename, csv.buffer);
    zip.file('README.txt', buildReadme(exportRecord, csv));

    const buffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
    });

    const filename = buildZipFilename(exportRecord);
    const s3Key = buildS3Key(exportRecord);

    logger.info('ZIP archive generated', {
        exportId: exportRecord.exportId,
        sizeBytes: buffer.length,
        s3Key,
    });

    return { buffer, s3Key, filename };
}

function buildZipFilename(exportRecord: Export): string {
    const period = exportRecord.periodStart.slice(0, 7).replace('-', '_');
    return `InvoiceExport_${period}_${exportRecord.exportId}.zip`;
}

function buildS3Key(exportRecord: Export): string {
    // Scoped under teamId so per-team S3 lifecycle rules can target the prefix
    return `exports/${exportRecord.teamId}/${exportRecord.exportId}.zip`;
}

function buildReadme(exportRecord: Export, csv: GeneratedCsv): string {
    return [
        'Invoice CSV Export',
        '==================',
        '',
        `Export ID       : ${exportRecord.exportId}`,
        `Period          : ${exportRecord.periodStart} – ${exportRecord.periodEnd}`,
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
