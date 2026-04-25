import { ExportBatch, Invoice } from '@smart-invoice-analyzer/contracts';
import { logger } from '@smart-invoice-analyzer/observability';
import { buildDatevHeader } from './datev-header.js';
import { mapInvoiceToDatevRow, MapOptions, serialiseDatevRow } from './datev-mapper.js';

export interface CsvGeneratorOptions extends MapOptions {
    encoding: 'windows-1252' | 'utf-8-bom';
}

export interface GeneratedCsv {
    /** Raw CSV content as a Buffer (encoded per options.encoding) */
    buffer: Buffer;
    filename: string;
    rowCount: number;
}

export function generateDatevCsv(
    batch: ExportBatch,
    invoices: Invoice[],
    options: CsvGeneratorOptions
): GeneratedCsv {
    logger.info('Generating DATEV CSV', {
        exportBatchId: batch.exportBatchId,
        invoiceCount: invoices.length,
        encoding: options.encoding,
    });

    // Build data rows first so we know the count for the header
    const dataRows = invoices.map((inv) => {
        const row = mapInvoiceToDatevRow(inv, batch, options);
        return serialiseDatevRow(row);
    });

    const header = buildDatevHeader(batch, dataRows.length);
    const fullCsv = header + dataRows.join('\n') + '\n';

    const buffer = encodeContent(fullCsv, options.encoding);
    const filename = buildFilename(batch);

    return { buffer, filename, rowCount: dataRows.length };
}

// ── Encoding ──────────────────────────────────────────────────────────────────

function encodeContent(content: string, encoding: CsvGeneratorOptions['encoding']): Buffer {
    if (encoding === 'utf-8-bom') {
        // UTF-8 with BOM — modern DATEV versions accept this
        const bom = Buffer.from([0xef, 0xbb, 0xbf]);
        return Buffer.concat([bom, Buffer.from(content, 'utf-8')]);
    }

    // Windows-1252 (ANSI) — required by older DATEV versions
    // Node.js doesn't support Windows-1252 natively; we do a best-effort
    // transliteration of common German characters.
    const transliterated = transliterateToWindows1252(content);
    return Buffer.from(transliterated, 'latin1');
}

function transliterateToWindows1252(text: string): string {
    return text
        .replace(/Ä/g, '\xc4')
        .replace(/Ö/g, '\xd6')
        .replace(/Ü/g, '\xdc')
        .replace(/ä/g, '\xe4')
        .replace(/ö/g, '\xf6')
        .replace(/ü/g, '\xfc')
        .replace(/ß/g, '\xdf')
        .replace(/€/g, '\x80');
}

// ── Filename ──────────────────────────────────────────────────────────────────

function buildFilename(batch: ExportBatch): string {
    // e.g. DATEV_Buchungsstapel_2024_Q1.csv
    const period = batch.periodStart.slice(0, 7).replace('-', '_');
    return `DATEV_Buchungsstapel_${period}.csv`;
}
