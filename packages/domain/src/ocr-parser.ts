import { Invoice } from '@smart-invoice-analyzer/contracts';

export interface OcrParseResult {
    vendorName?: string;
    invoiceNumber?: string;
    invoiceDate?: string; // YYYY-MM-DD
    dueDate?: string; // YYYY-MM-DD
    currency: string;
    netAmount?: number;
    taxAmount?: number;
    taxRate?: number;
    totalAmount?: number;
    vatIdOrTaxNumber?: string;
}

// ── Date patterns ─────────────────────────────────────────────────────────────

const DATE_DE = /\b(\d{2})\.(\d{2})\.(\d{4})\b/;
const DATE_ISO = /\b(\d{4})-(\d{2})-(\d{2})\b/;

// ── Amount patterns (German: 1.234,56  English: 1,234.56) ────────────────────

const AMOUNT_DE = /(\d{1,3}(?:\.\d{3})*,\d{2})/;
const AMOUNT_EN = /(\d{1,3}(?:,\d{3})*\.\d{2})/;

// ── Field label patterns ──────────────────────────────────────────────────────

const INVOICE_NUMBER_RE =
    /(?:Rechnungs(?:nummer|nr\.?|-)[\s:#]*|Re(?:\.\s*|-|\s+)Nr\.?[\s:#]*)([A-Z0-9][A-Z0-9\-_/]{2,30})/i;

const TAX_RATE_RE = /(\d{1,2})\s*%\s*(?:Mw(?:St|StuSt)?\.?|USt\.?|VAT)/i;

const TOTAL_RE =
    /(?:Gesamtbetrag|Rechnungsbetrag|Bruttobetrag|Betrag\s+inkl|Summe|Total|Zu\s+zahlen|Endbetrag)[\s:]*(.+)/i;

const NET_RE = /(?:Nettobetrag|Netto|Zwischensumme|Subtotal)[\s:]*(.+)/i;

const TAX_AMOUNT_RE =
    /(?:MwSt\.?|Mehrwertsteuer|USt\.?|Umsatzsteuer|VAT|Tax)[\s.:]*(?:\d{1,2}\s*%)?[\s:]*(.+)/i;

const VAT_ID_RE =
    /(?:USt(?:\.|-)?Id(?:entifikations)?(?:nummer)?|Steuernummer|VAT-?ID)[\s:]*([A-Z]{2}\d{9,11}|\d{10,11})/i;

const DUE_DATE_RE =
    /(?:Fälligkeitsdatum|Zahlungsziel|Fällig(?:\s+am)?|Due\s+date)[\s:]*(\d{2}\.\d{2}\.\d{4})/i;

const DATE_LABEL_RE = /Rechnungsdatum|Datum|Invoice\s*Date/i;

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseAmount(raw: string): number | undefined {
    const cleaned = raw.replace(/[€$£\s]/g, '').trim();

    // German: 1.234,56
    const deMatch = cleaned.match(/^(\d{1,3}(?:\.\d{3})*),(\d{2})$/);
    if (deMatch) {
        return parseFloat(deMatch[1].replace(/\./g, '') + '.' + deMatch[2]);
    }

    // English: 1,234.56
    const enMatch = cleaned.match(/^(\d{1,3}(?:,\d{3})*)\.(\d{2})$/);
    if (enMatch) {
        return parseFloat(enMatch[1].replace(/,/g, '') + '.' + enMatch[2]);
    }

    const plain = parseFloat(cleaned.replace(',', '.'));
    return isNaN(plain) ? undefined : plain;
}

function extractAmount(line: string): number | undefined {
    const match = line.match(AMOUNT_DE) ?? line.match(AMOUNT_EN);
    return match ? parseAmount(match[1]) : undefined;
}

function parseDate(raw: string): string | undefined {
    const deMatch = raw.match(DATE_DE);
    if (deMatch) return `${deMatch[3]}-${deMatch[2]}-${deMatch[1]}`;

    const isoMatch = raw.match(DATE_ISO);
    if (isoMatch) return isoMatch[0];

    return undefined;
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseOcrText(rawText: string): OcrParseResult {
    const lines = rawText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
    const fullText = lines.join('\n');

    // Vendor name: first non-numeric, non-date line that doesn't look like a heading keyword
    const vendorName = lines.find(
        (l) =>
            l.length >= 3 &&
            !/^\d/.test(l) &&
            !DATE_DE.test(l) &&
            !/^(Rechnung|Invoice|Beleg|Datum|Seite|Page)/i.test(l)
    );

    // Invoice number
    const invoiceNumberMatch = fullText.match(INVOICE_NUMBER_RE);
    const invoiceNumber = invoiceNumberMatch?.[1]?.trim();

    // Invoice date — prefer line with a date label, fall back to first date found
    let invoiceDate: string | undefined;
    const dateLabelLine = lines.find((l) => DATE_LABEL_RE.test(l));
    if (dateLabelLine) invoiceDate = parseDate(dateLabelLine);
    if (!invoiceDate) {
        for (const line of lines) {
            invoiceDate = parseDate(line);
            if (invoiceDate) break;
        }
    }

    // Due date
    const dueDateMatch = fullText.match(DUE_DATE_RE);
    const dueDate = dueDateMatch ? parseDate(dueDateMatch[1]) : undefined;

    // Tax rate
    const taxRateMatch = fullText.match(TAX_RATE_RE);
    const taxRate = taxRateMatch ? parseInt(taxRateMatch[1], 10) : undefined;

    // Amounts
    let totalAmount: number | undefined;
    const totalMatch = fullText.match(TOTAL_RE);
    if (totalMatch) totalAmount = extractAmount(totalMatch[1]);

    let netAmount: number | undefined;
    const netMatch = fullText.match(NET_RE);
    if (netMatch) netAmount = extractAmount(netMatch[1]);

    let taxAmount: number | undefined;
    const taxMatch = fullText.match(TAX_AMOUNT_RE);
    if (taxMatch) taxAmount = extractAmount(taxMatch[1]);

    // Derive missing amount from the other two
    if (netAmount !== undefined && taxRate !== undefined && totalAmount === undefined) {
        totalAmount = +(netAmount * (1 + taxRate / 100)).toFixed(2);
    }
    if (netAmount !== undefined && totalAmount !== undefined && taxAmount === undefined) {
        taxAmount = +(totalAmount - netAmount).toFixed(2);
    }

    // VAT ID / tax number
    const vatMatch = fullText.match(VAT_ID_RE);
    const vatIdOrTaxNumber = vatMatch?.[1]?.trim();

    return {
        vendorName,
        invoiceNumber,
        invoiceDate,
        dueDate,
        currency: 'EUR',
        netAmount,
        taxAmount,
        taxRate,
        totalAmount,
        vatIdOrTaxNumber,
    };
}

/**
 * Merge parsed OCR fields into an existing invoice, only filling missing values.
 */
export function mergeOcrParseIntoInvoice(
    invoice: Invoice,
    parsed: OcrParseResult
): Partial<Invoice> {
    const patch: Partial<Invoice> = {};

    if (!invoice.vendorName && parsed.vendorName) patch.vendorName = parsed.vendorName;
    if (!invoice.invoiceNumber && parsed.invoiceNumber) patch.invoiceNumber = parsed.invoiceNumber;
    if (!invoice.invoiceDate && parsed.invoiceDate) patch.invoiceDate = parsed.invoiceDate;
    if (!invoice.dueDate && parsed.dueDate) patch.dueDate = parsed.dueDate;
    if (!invoice.netAmount && parsed.netAmount) patch.netAmount = parsed.netAmount;
    if (!invoice.taxAmount && parsed.taxAmount) patch.taxAmount = parsed.taxAmount;
    if (!invoice.taxRate && parsed.taxRate) patch.taxRate = parsed.taxRate;
    if (!invoice.totalAmount && parsed.totalAmount) patch.totalAmount = parsed.totalAmount;
    if (!invoice.vatIdOrTaxNumber && parsed.vatIdOrTaxNumber)
        patch.vatIdOrTaxNumber = parsed.vatIdOrTaxNumber;

    return patch;
}
