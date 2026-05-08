import { Invoice, UpdateInvoiceRequest } from '@smart-invoice-analyzer/contracts';

export type InvoiceDraftFields = {
    vendorName: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    currency: string;
    netAmount: string;
    taxAmount: string;
    taxRate: number | undefined;
    totalAmount: string;
    vatIdOrTaxNumber: string;
    category: string;
};

export function invoiceToDraft(invoice: Invoice): InvoiceDraftFields {
    return {
        vendorName: invoice.vendorName ?? '',
        invoiceNumber: invoice.invoiceNumber ?? '',
        invoiceDate: invoice.invoiceDate ?? '',
        dueDate: invoice.dueDate ?? '',
        currency: invoice.currency ?? 'EUR',
        netAmount: invoice.netAmount !== undefined ? String(invoice.netAmount) : '',
        taxAmount: invoice.taxAmount !== undefined ? String(invoice.taxAmount) : '',
        taxRate: invoice.taxRate,
        totalAmount: invoice.totalAmount !== undefined ? String(invoice.totalAmount) : '',
        vatIdOrTaxNumber: invoice.vatIdOrTaxNumber ?? '',
        category: invoice.category ?? '',
    };
}

export function draftToRequest(draft: InvoiceDraftFields): UpdateInvoiceRequest {
    const patch: UpdateInvoiceRequest = {};
    if (draft.vendorName.trim()) patch.vendorName = draft.vendorName.trim();
    if (draft.invoiceNumber.trim()) patch.invoiceNumber = draft.invoiceNumber.trim();
    if (draft.invoiceDate.trim()) patch.invoiceDate = draft.invoiceDate.trim();
    if (draft.dueDate.trim()) patch.dueDate = draft.dueDate.trim();
    else patch.dueDate = undefined;
    if (draft.currency.trim()) patch.currency = draft.currency.trim().toUpperCase();
    const net = parseFloat(draft.netAmount);
    if (!isNaN(net)) patch.netAmount = net;
    const tax = parseFloat(draft.taxAmount);
    if (!isNaN(tax)) patch.taxAmount = tax;
    if (draft.taxRate !== undefined) patch.taxRate = draft.taxRate;
    const total = parseFloat(draft.totalAmount);
    if (!isNaN(total)) patch.totalAmount = total;
    if (draft.vatIdOrTaxNumber.trim()) patch.vatIdOrTaxNumber = draft.vatIdOrTaxNumber.trim();
    if (draft.category) patch.category = draft.category as UpdateInvoiceRequest['category'];
    return patch;
}

export function validateInvoiceDraft(draft: InvoiceDraftFields): string | null {
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (draft.invoiceDate && !dateRe.test(draft.invoiceDate)) {
        return 'Invoice date must be in YYYY-MM-DD format.';
    }
    if (draft.dueDate && !dateRe.test(draft.dueDate)) {
        return 'Due date must be in YYYY-MM-DD format.';
    }
    const total = parseFloat(draft.totalAmount);
    if (draft.totalAmount && isNaN(total)) {
        return 'Total amount must be a valid number.';
    }
    const net = parseFloat(draft.netAmount);
    if (draft.netAmount && isNaN(net)) {
        return 'Net amount must be a valid number.';
    }
    const taxAmt = parseFloat(draft.taxAmount);
    if (draft.taxAmount && isNaN(taxAmt)) {
        return 'Tax amount must be a valid number.';
    }
    return null;
}
