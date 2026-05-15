import { Logger } from '@aws-lambda-powertools/logger';
import { Export, Invoice } from '@smart-invoice-analyzer/contracts';

const logger = new Logger({ serviceName: 'smart-invoice-analyzer-export' });

export interface CsvGeneratorOptions {
    includeDocumentReferences: boolean;
    bucketName: string;
    invoicePrefix: string;
}

export interface GeneratedCsv {
    buffer: Buffer;
    filename: string;
    rowCount: number;
}

const HEADERS = [
    'Invoice ID',
    'Vendor Name',
    'Invoice Number',
    'Invoice Date',
    'Due Date',
    'Currency',
    'Net Amount',
    'Tax Amount',
    'Tax Rate (%)',
    'Total Amount',
    'VAT/Tax ID',
    'Category',
    'Status',
    'Export ID',
    'Document Reference',
];

function escapeField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function buildDocumentReference(invoice: Invoice, options: CsvGeneratorOptions): string {
    if (!options.includeDocumentReferences) return '';
    // S3 key: invoices/original/{teamId}/{fileObjectId}
    return `https://s3.amazonaws.com/${options.bucketName}/${options.invoicePrefix}${invoice.teamId}/${invoice.sourceFileId}`;
}

function invoiceToRow(invoice: Invoice, options: CsvGeneratorOptions): string {
    const fields = [
        invoice.invoiceId,
        invoice.vendorName ?? '',
        invoice.invoiceNumber ?? '',
        invoice.invoiceDate ?? '',
        invoice.dueDate ?? '',
        invoice.currency ?? '',
        invoice.netAmount !== undefined ? invoice.netAmount.toFixed(2) : '',
        invoice.taxAmount !== undefined ? invoice.taxAmount.toFixed(2) : '',
        invoice.taxRate !== undefined ? String(invoice.taxRate) : '',
        invoice.totalAmount !== undefined ? invoice.totalAmount.toFixed(2) : '',
        invoice.vatIdOrTaxNumber ?? '',
        invoice.category ?? '',
        invoice.status,
        invoice.exportId ?? '',
        buildDocumentReference(invoice, options),
    ];
    return fields.map(escapeField).join(',');
}

export function generateCsv(
    invoices: Invoice[],
    exportRecord: Export,
    options: CsvGeneratorOptions
): GeneratedCsv {
    logger.info('Generating CSV', {
        exportId: exportRecord.exportId,
        invoiceCount: invoices.length,
    });

    const headerRow = HEADERS.map(escapeField).join(',');
    const dataRows = invoices.map((inv) => invoiceToRow(inv, options));
    const content = [headerRow, ...dataRows].join('\n') + '\n';

    // UTF-8 with BOM so Excel opens correctly
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    const buffer = Buffer.concat([bom, Buffer.from(content, 'utf-8')]);

    const period = exportRecord.periodStart.slice(0, 7).replace('-', '_');
    const filename = `InvoiceExport_${period}.csv`;

    return { buffer, filename, rowCount: dataRows.length };
}
