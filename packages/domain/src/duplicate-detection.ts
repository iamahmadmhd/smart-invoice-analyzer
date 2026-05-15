import { Invoice } from '@smart-invoice-analyzer/contracts';
import { differenceInDays } from 'date-fns/fp';

const AMOUNT_TOLERANCE_PERCENT = 0.01;
const DATE_WINDOW_DAYS = 3;

function normaliseVendor(name: string | undefined): string {
    return (name ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

function amountsMatch(a: number | undefined, b: number | undefined): boolean {
    if (a === undefined || b === undefined) return false;
    if (a === 0 && b === 0) return true;
    const max = Math.max(Math.abs(a), Math.abs(b));
    return Math.abs(a - b) / max <= AMOUNT_TOLERANCE_PERCENT;
}

export interface DuplicateCheckResult {
    isDuplicate: boolean;
    duplicateOfInvoiceId?: string;
    reason?: string;
}

export function checkForDuplicate(candidate: Invoice, existing: Invoice[]): DuplicateCheckResult {
    const others = existing.filter((i) => i.invoiceId !== candidate.invoiceId);

    for (const other of others) {
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

        const sameVendor =
            normaliseVendor(candidate.vendorName) === normaliseVendor(other.vendorName) &&
            normaliseVendor(candidate.vendorName) !== '';

        const sameAmount = amountsMatch(candidate.totalAmount, other.totalAmount);

        const closeDate =
            candidate.invoiceDate &&
            other.invoiceDate &&
            differenceInDays(candidate.invoiceDate, other.invoiceDate) <= DATE_WINDOW_DAYS;

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
