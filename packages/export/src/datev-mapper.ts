import { DatevRow, ExportBatch, Invoice } from '@smart-invoice-analyzer/contracts';
import {
    formatGermanAmount,
    formatGermanDate,
    vatRateToBUSchluessel,
} from '@smart-invoice-analyzer/domain';

export interface MapOptions {
    includeDocumentReferences: boolean;
    bucketName: string;
    invoicePrefix: string;
}

// ── Default G/L account by SKR ────────────────────────────────────────────────
// These are sensible defaults — a tax advisor would override with their own
// account mappings per vendor/category in a real implementation.

const DEFAULT_EXPENSE_ACCOUNT: Record<string, string> = {
    SKR03: '4700', // Fremdleistungen (third-party services) in SKR03
    SKR04: '6300', // Fremdleistungen in SKR04
};

export function mapInvoiceToDatevRow(
    invoice: Invoice,
    batch: ExportBatch,
    options: MapOptions
): DatevRow {
    const account = DEFAULT_EXPENSE_ACCOUNT[batch.sachkontenrahmen] ?? '4700';

    // Belegdatum: DDMM
    const belegdatum = invoice.invoiceDate ? formatGermanDate(invoice.invoiceDate) : '';

    // Umsatz: German decimal format
    const umsatz = formatGermanAmount(invoice.totalAmount ?? 0);

    // BU-Schlüssel from VAT rate
    const buSchluessel = vatRateToBUSchluessel(invoice.taxRate);

    // Gegenkonto: use extracted VAT ID / creditor number if available
    const gegenkonto = invoice.vatIdOrTaxNumber ?? '';

    // Document reference: S3 key or invoice number
    const documentReference = options.includeDocumentReferences
        ? buildDocumentReference(invoice, options)
        : undefined;

    return {
        Umsatz: umsatz,
        SollHaben: 'S', // S = Soll (debit) for expenses
        Konto: account,
        Gegenkonto: gegenkonto || undefined,
        BUSchluessel: buSchluessel || undefined,
        Belegdatum: belegdatum,
        Belegfeld1: invoice.invoiceNumber ?? undefined,
        Buchungstext: invoice.vendorName
            ? invoice.vendorName.slice(0, 60) // DATEV max 60 chars
            : undefined,
        DocumentReference: documentReference,
    };
}

function buildDocumentReference(invoice: Invoice, options: MapOptions): string {
    // Construct a URL to the stored invoice PDF/image for digital document posting
    return `https://s3.amazonaws.com/${options.bucketName}/${options.invoicePrefix}${invoice.sourceFileId}`;
}

// ── Row serialiser ────────────────────────────────────────────────────────────
// Serialises a DatevRow to a semicolon-delimited line matching the column
// order defined in datev-header.ts.

export function serialiseDatevRow(row: DatevRow): string {
    const fields = [
        row.Umsatz,
        row.SollHaben,
        'EUR', // WKZ Umsatz — always EUR
        '', // Kurs
        '', // Basis-Umsatz
        '', // WKZ Basis-Umsatz
        row.Konto,
        row.Gegenkonto ?? '',
        row.BUSchluessel ?? '',
        row.Belegdatum,
        row.Belegfeld1 ?? '',
        '', // Belegfeld 2
        '', // Skonto
        row.Buchungstext ?? '',
        '', // Postensperre
        '', // Diverse Adressnummer
        '', // Geschäftspartnerbank
        '', // Sachverhalt
        '', // Zinssperre
        row.DocumentReference ?? '', // Beleglink
        '', // Beleginfo Art 1
        '', // Beleginfo Inhalt 1
    ];

    return fields.join(';');
}
