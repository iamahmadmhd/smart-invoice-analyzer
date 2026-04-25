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

    // Add the DATEV CSV
    zip.file(csv.filename, csv.buffer);

    // Add a human-readable manifest
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildZipFilename(batch: ExportBatch): string {
    const period = batch.periodStart.slice(0, 7).replace('-', '_');
    return `DATEV_Export_${period}_${batch.exportBatchId}.zip`;
}

function buildS3Key(batch: ExportBatch): string {
    return `exports/${batch.userId}/${batch.exportBatchId}.zip`;
}

function buildReadme(batch: ExportBatch, csv: GeneratedCsv): string {
    return [
        'DATEV EXTF 7.0 Export',
        '======================',
        '',
        `Export Batch ID : ${batch.exportBatchId}`,
        `Period          : ${batch.periodStart} – ${batch.periodEnd}`,
        `Beraternummer   : ${batch.beraternummer}`,
        `Mandantennummer : ${batch.mandantennummer}`,
        `Kontenrahmen    : ${batch.sachkontenrahmen}`,
        `Kontenlänge     : ${batch.sachkontenlaenge}`,
        `Buchungen       : ${csv.rowCount}`,
        `Erstellt am     : ${new Date().toISOString()}`,
        '',
        'Enthaltene Dateien',
        '------------------',
        `  ${csv.filename}  — DATEV Buchungsstapel`,
        '',
        'Import',
        '------',
        'Diese Datei kann direkt in DATEV Unternehmen Online, DATEV Pro,',
        'ADDISON oder BMD über die EXTF-Importfunktion importiert werden.',
    ].join('\n');
}
