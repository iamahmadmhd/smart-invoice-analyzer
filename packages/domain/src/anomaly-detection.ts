import { Invoice } from '@smart-invoice-analyzer/contracts';

// ── Thresholds ────────────────────────────────────────────────────────────────

const VALID_GERMAN_VAT_RATES = [0, 7, 19]; // %
const MAX_AMOUNT_MULTIPLIER = 5; // flag if 5× the user's average
const MIN_INVOICES_FOR_BASELINE = 5; // need at least this many to compute average

// ── Result type ───────────────────────────────────────────────────────────────

export interface AnomalyCheckResult {
    isAnomaly: boolean;
    reasons: string[];
}

// ── Core logic ────────────────────────────────────────────────────────────────

export function checkForAnomalies(invoice: Invoice, recentInvoices: Invoice[]): AnomalyCheckResult {
    const reasons: string[] = [];

    // 1. Unexpected VAT rate
    if (invoice.taxRate !== undefined && !VALID_GERMAN_VAT_RATES.includes(invoice.taxRate)) {
        reasons.push(
            `Unusual VAT rate ${invoice.taxRate}% — expected one of ${VALID_GERMAN_VAT_RATES.join(', ')}%`
        );
    }

    // 2. Net + tax does not equal total (allow 1 cent rounding)
    if (
        invoice.netAmount !== undefined &&
        invoice.taxAmount !== undefined &&
        invoice.totalAmount !== undefined
    ) {
        const computed = invoice.netAmount + invoice.taxAmount;
        if (Math.abs(computed - invoice.totalAmount) > 0.01) {
            reasons.push(
                `Amount mismatch: net ${invoice.netAmount} + tax ${invoice.taxAmount} ≠ total ${invoice.totalAmount}`
            );
        }
    }

    // 3. Unusually large amount compared to user's history
    const completed = recentInvoices.filter(
        (i) => i.invoiceId !== invoice.invoiceId && i.totalAmount !== undefined
    );

    if (completed.length >= MIN_INVOICES_FOR_BASELINE && invoice.totalAmount !== undefined) {
        const amounts = completed.map((i) => i.totalAmount as number);
        const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;

        if (invoice.totalAmount > avg * MAX_AMOUNT_MULTIPLIER) {
            reasons.push(
                `Total amount ${invoice.totalAmount} is ${(invoice.totalAmount / avg).toFixed(1)}× the average of ${avg.toFixed(2)}`
            );
        }
    }

    // 4. Future-dated invoice
    if (invoice.invoiceDate) {
        const invoiceDate = new Date(invoice.invoiceDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (invoiceDate > today) {
            reasons.push(`Invoice date ${invoice.invoiceDate} is in the future`);
        }
    }

    // 5. Low confidence score from AI extraction
    if (invoice.confidenceScore !== undefined && invoice.confidenceScore < 0.5) {
        reasons.push(
            `Low AI extraction confidence: ${(invoice.confidenceScore * 100).toFixed(0)}%`
        );
    }

    return { isAnomaly: reasons.length > 0, reasons };
}
