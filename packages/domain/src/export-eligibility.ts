import { Invoice, ValidationReport, ValidationWarning } from '@smart-invoice-analyzer/contracts';

export function validateInvoicesForExport(invoices: Invoice[]): ValidationReport {
    const warnings: ValidationWarning[] = [];
    const errors: ValidationWarning[] = [];

    for (const invoice of invoices) {
        if (invoice.exportStatus === 'EXPORTED') {
            errors.push({
                invoiceId: invoice.invoiceId,
                field: 'exportStatus',
                code: 'ALREADY_EXPORTED',
                message: `Invoice ${invoice.invoiceId} has already been exported`,
            });
        }

        if (!invoice.invoiceDate) {
            errors.push({
                invoiceId: invoice.invoiceId,
                field: 'invoiceDate',
                code: 'MISSING_INVOICE_DATE',
                message: 'Invoice date is required for export',
            });
        }

        if (!invoice.totalAmount) {
            errors.push({
                invoiceId: invoice.invoiceId,
                field: 'totalAmount',
                code: 'MISSING_TOTAL',
                message: 'Total amount is required for export',
            });
        }

        if (!invoice.invoiceNumber) {
            warnings.push({
                invoiceId: invoice.invoiceId,
                field: 'invoiceNumber',
                code: 'MISSING_INVOICE_NUMBER',
                message: 'Invoice number is missing',
            });
        }

        if (!invoice.vendorName) {
            warnings.push({
                invoiceId: invoice.invoiceId,
                field: 'vendorName',
                code: 'MISSING_VENDOR',
                message: 'Vendor name is missing',
            });
        }
    }

    const eligibleInvoices = invoices.filter(
        (inv) => !errors.some((e) => e.invoiceId === inv.invoiceId)
    ).length;

    return {
        totalInvoices: invoices.length,
        eligibleInvoices,
        skippedInvoices: invoices.length - eligibleInvoices,
        warnings,
        errors,
        canProceed: errors.length === 0 && invoices.length > 0,
    };
}
