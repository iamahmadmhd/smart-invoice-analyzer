import { Invoice } from '@smart-invoice-analyzer/contracts';
import { isAfter, startOfDay } from 'date-fns';

const VALID_GERMAN_VAT_RATES = [0, 7, 19];
const MAX_AMOUNT_MULTIPLIER = 5;
const MIN_INVOICES_FOR_BASELINE = 5;

export interface AnomalyCheckResult {
    isAnomaly: boolean;
    reasons: string[];
}

export function checkForAnomalies(invoice: Invoice, recentInvoices: Invoice[]): AnomalyCheckResult {
    const reasons: string[] = [];

    if (invoice.taxRate !== undefined && !VALID_GERMAN_VAT_RATES.includes(invoice.taxRate)) {
        reasons.push(
            `Unusual VAT rate ${invoice.taxRate}% — expected one of ${VALID_GERMAN_VAT_RATES.join(', ')}%`
        );
    }

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

    if (invoice.invoiceDate) {
        const invoiceDate = new Date(invoice.invoiceDate);
        if (isAfter(startOfDay(invoiceDate), startOfDay(new Date()))) {
            reasons.push(`Invoice date ${invoice.invoiceDate} is in the future`);
        }
    }

    if (invoice.confidenceScore !== undefined && invoice.confidenceScore < 0.5) {
        reasons.push(
            `Low AI extraction confidence: ${(invoice.confidenceScore * 100).toFixed(0)}%`
        );
    }

    return { isAnomaly: reasons.length > 0, reasons };
}
