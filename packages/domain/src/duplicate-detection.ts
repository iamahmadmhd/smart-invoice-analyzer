import { Invoice } from '@smart-invoice-analyzer/contracts';

// ── Thresholds ────────────────────────────────────────────────────────────────

const AMOUNT_TOLERANCE_PERCENT = 0.01; // 1% difference allowed
const DATE_WINDOW_DAYS = 3; // invoices within 3 days are candidates

// ── Helpers ───────────────────────────────────────────────────────────────────

function normaliseVendor(name: string | undefined): string {
    return (name ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

function daysBetween(a: string, b: string): number {
    const msPerDay = 86400000;
    return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / msPerDay;
}

function amountsMatch(a: number | undefined, b: number | undefined): boolean {
    if (a === undefined || b === undefined) return false;
    if (a === 0 && b === 0) return true;
    const max = Math.max(Math.abs(a), Math.abs(b));
    return Math.abs(a - b) / max <= AMOUNT_TOLERANCE_PERCENT;
}

// ── Core logic ────────────────────────────────────────────────────────────────

export interface DuplicateCheckResult {
    isDuplicate: boolean;
    duplicateOfInvoiceId?: string;
    reason?: string;
}

export function checkForDuplicate(candidate: Invoice, existing: Invoice[]): DuplicateCheckResult {
    // Skip the candidate itself
    const others = existing.filter((i) => i.invoiceId !== candidate.invoiceId);

    for (const other of others) {
        // Exact invoice number match from same vendor → definite duplicate
        if (
            candidate.invoiceNumber &&
            other.invoiceNumber &&
            candidate.invoiceNumber === other.invoiceNumber &&
            normaliseVendor(candidate.vendorName) === normaliseVendor(other.vendorName)
        ) {
            return {
                isDuplicate: true,
                duplicateOfInvoiceId: other.invoiceId,
                reason: `Duplicate invoice number ${candidate.invoiceNumber} from ${candidate.vendorName}`,
            };
        }

        // Same vendor + same amount + close date → likely duplicate
        const sameVendor =
            normaliseVendor(candidate.vendorName) === normaliseVendor(other.vendorName) &&
            normaliseVendor(candidate.vendorName) !== '';

        const sameAmount = amountsMatch(candidate.totalAmount, other.totalAmount);

        const closeDate =
            candidate.invoiceDate &&
            other.invoiceDate &&
            daysBetween(candidate.invoiceDate, other.invoiceDate) <= DATE_WINDOW_DAYS;

        if (sameVendor && sameAmount && closeDate) {
            return {
                isDuplicate: true,
                duplicateOfInvoiceId: other.invoiceId,
                reason: `Same vendor, amount, and date window as invoice ${other.invoiceId}`,
            };
        }
    }

    return { isDuplicate: false };
}
