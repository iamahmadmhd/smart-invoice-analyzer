import { z } from 'zod';

// ── Enums ─────────────────────────────────────────────────────────────────────

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

// ── Core invoice entity ───────────────────────────────────────────────────────

export const InvoiceSchema = z.object({
    invoiceId: z.string().min(1),
    userId: z.string().min(1),
    vendorName: z.string().optional(),
    invoiceNumber: z.string().optional(),
    invoiceDate: z.string().optional(), // ISO date string: YYYY-MM-DD
    dueDate: z.string().optional(),
    currency: z.string().default('EUR'),
    netAmount: z.number().optional(),
    taxAmount: z.number().optional(),
    taxRate: z.number().optional(), // e.g. 19 for 19%
    totalAmount: z.number().optional(),
    vatIdOrTaxNumber: z.string().optional(),
    category: z.string().optional(),
    status: InvoiceStatusSchema,
    duplicateFlag: z.boolean().default(false),
    anomalyFlag: z.boolean().default(false),
    confidenceScore: z.number().min(0).max(1).optional(),
    sourceFileId: z.string().min(1),
    exportBatchId: z.string().optional(),
    exportedAt: z.string().optional(),
    exportStatus: ExportStatusSchema.default('NOT_EXPORTED'),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

// ── Request / response DTOs ───────────────────────────────────────────────────

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
    dateFrom: z.string().optional(), // YYYY-MM-DD
    dateTo: z.string().optional(), // YYYY-MM-DD
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

export const PresignRequestSchema = z.object({
    fileName: z.string().min(1),
    contentType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
    fileSizeBytes: z.number().positive(),
});
export type PresignRequest = z.infer<typeof PresignRequestSchema>;

export const PresignResponseSchema = z.object({
    uploadUrl: z.string().url(),
    fileObjectId: z.string().min(1),
    expiresAt: z.string(),
});
export type PresignResponse = z.infer<typeof PresignResponseSchema>;
