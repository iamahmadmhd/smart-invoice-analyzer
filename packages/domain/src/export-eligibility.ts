import { Invoice, ValidationReport, ValidationWarning } from '@smart-invoice-analyzer/contracts';

export function validateInvoicesForExport(
    invoices: Invoice[],
    sachkontenlaenge: number
): ValidationReport {
    const warnings: ValidationWarning[] = [];
    const errors: ValidationWarning[] = [];

    for (const invoice of invoices) {
        // Already exported — hard error, prevents double booking
        if (invoice.exportStatus === 'EXPORTED') {
            errors.push({
                invoiceId: invoice.invoiceId,
                field: 'exportStatus',
                code: 'ALREADY_EXPORTED',
                message: `Invoice ${invoice.invoiceId} has already been exported`,
            });
        }

        // Missing required fields
        if (!invoice.invoiceDate) {
            errors.push({
                invoiceId: invoice.invoiceId,
                field: 'invoiceDate',
                code: 'MISSING_INVOICE_DATE',
                message: 'Invoice date is required for DATEV export',
            });
        } else if (isNaN(Date.parse(invoice.invoiceDate))) {
            errors.push({
                invoiceId: invoice.invoiceId,
                field: 'invoiceDate',
                code: 'UNREADABLE_DATE',
                message: `Invoice date "${invoice.invoiceDate}" could not be parsed`,
            });
        }

        if (!invoice.totalAmount) {
            errors.push({
                invoiceId: invoice.invoiceId,
                field: 'totalAmount',
                code: 'MISSING_TOTAL',
                message: 'Total amount is required for DATEV export',
            });
        }

        // Warnings — export can proceed but advisor should review
        if (!invoice.invoiceNumber) {
            warnings.push({
                invoiceId: invoice.invoiceId,
                field: 'invoiceNumber',
                code: 'MISSING_INVOICE_NUMBER',
                message: 'Invoice number is missing — Belegfeld 1 will be empty',
            });
        }

        if (!invoice.vendorName) {
            warnings.push({
                invoiceId: invoice.invoiceId,
                field: 'vendorName',
                code: 'MISSING_VENDOR',
                message: 'Vendor name is missing — Buchungstext will be empty',
            });
        }

        if (invoice.taxRate === undefined) {
            warnings.push({
                invoiceId: invoice.invoiceId,
                field: 'taxRate',
                code: 'MISSING_VAT_RATE',
                message: 'VAT rate is missing — BU-Schlüssel cannot be determined',
            });
        }

        // Account length validation
        if (invoice.vatIdOrTaxNumber) {
            const accountLen = invoice.vatIdOrTaxNumber.replace(/\D/g, '').length;
            if (accountLen > 0 && accountLen !== sachkontenlaenge) {
                warnings.push({
                    invoiceId: invoice.invoiceId,
                    field: 'vatIdOrTaxNumber',
                    code: 'ACCOUNT_LENGTH_MISMATCH',
                    message: `Account length ${accountLen} does not match configured Sachkontenlänge ${sachkontenlaenge}`,
                });
            }
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
