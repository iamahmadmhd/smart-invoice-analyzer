import { z } from 'zod';

export const InvoiceStatusSchema = z.enum([
    'UPLOADED',
    'PROCESSING',
    'EXTRACTED',
    'ENRICHED',
    'REVIEW_READY',
    'COMPLETED',
    'FAILED_OCR',
    'FAILED_VALIDATION',
    'FAILED_AI',
    'FAILED_INTERNAL',
]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export const ExportStatusSchema = z.enum(['NOT_EXPORTED', 'EXPORTED']);
export type ExportStatus = z.infer<typeof ExportStatusSchema>;

export const InvoiceSchema = z.object({
    invoiceId: z.string().min(1),
    teamId: z.string().min(1),
    uploadedBy: z.string().min(1),
    vendorName: z.string().optional(),
    invoiceNumber: z.string().optional(),
    invoiceDate: z.iso.date().optional(),
    dueDate: z.iso.date().optional(),
    currency: z.string().default('EUR'),
    netAmount: z.number().optional(),
    taxAmount: z.number().optional(),
    taxRate: z.number().optional(),
    totalAmount: z.number().optional(),
    vatIdOrTaxNumber: z.string().optional(),
    category: z.string().optional(),
    status: InvoiceStatusSchema,
    duplicateFlag: z.boolean().default(false),
    anomalyFlag: z.boolean().default(false),
    confidenceScore: z.number().min(0).max(1).optional(),
    sourceFileId: z.string().min(1),
    exportId: z.string().optional(),
    exportedAt: z.iso.datetime().optional(),
    exportStatus: ExportStatusSchema.default('NOT_EXPORTED'),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

export const CreateInvoiceRequestSchema = z.object({
    sourceFileId: z.string().min(1),
    fileName: z.string().min(1),
    contentType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
});
export type CreateInvoiceRequest = z.infer<typeof CreateInvoiceRequestSchema>;

export const ListInvoicesQuerySchema = z.object({
    status: InvoiceStatusSchema.optional(),
    exportStatus: ExportStatusSchema.optional(),
    category: z.string().optional(),
    vendorName: z.string().optional(),
    dateFrom: z.iso.date().optional(),
    dateTo: z.iso.date().optional(),
    duplicateFlag: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    anomalyFlag: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    nextToken: z.string().optional(),
});
export type ListInvoicesQuery = z.infer<typeof ListInvoicesQuerySchema>;

export const ListInvoicesResponseSchema = z.object({
    invoices: z.array(InvoiceSchema),
    nextToken: z.string().optional(),
    total: z.number().optional(),
});
export type ListInvoicesResponse = z.infer<typeof ListInvoicesResponseSchema>;

export const UpdateInvoiceRequestSchema = z.object({
    vendorName: z.string().min(1).optional(),
    invoiceNumber: z.string().min(1).optional(),
    invoiceDate: z.iso.date().optional(),
    dueDate: z.iso.date().optional(),
    currency: z.string().length(3).optional(),
    netAmount: z.number().nonnegative().optional(),
    taxAmount: z.number().nonnegative().optional(),
    taxRate: z.number().min(0).max(100).optional(),
    totalAmount: z.number().nonnegative().optional(),
    vatIdOrTaxNumber: z.string().optional(),
    category: z
        .enum([
            'software',
            'hardware',
            'office',
            'travel',
            'marketing',
            'utilities',
            'consulting',
            'other',
        ])
        .optional(),
});
export type UpdateInvoiceRequest = z.infer<typeof UpdateInvoiceRequestSchema>;

export const PresignRequestSchema = z.object({
    fileName: z.string().min(1),
    contentType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
    fileSizeBytes: z.number().positive(),
});
export type PresignRequest = z.infer<typeof PresignRequestSchema>;

export const PresignResponseSchema = z.object({
    uploadUrl: z.url(),
    fileObjectId: z.string().min(1),
    expiresAt: z.iso.datetime(),
});
export type PresignResponse = z.infer<typeof PresignResponseSchema>;
