import { z } from 'zod';

// ── Enums ─────────────────────────────────────────────────────────────────────

export const ExportBatchStatusSchema = z.enum([
    'PENDING',
    'VALIDATING',
    'READY',
    'GENERATING',
    'COMPLETED',
    'FAILED',
]);
export type ExportBatchStatus = z.infer<typeof ExportBatchStatusSchema>;

export const SachkontenrahmenSchema = z.enum(['SKR03', 'SKR04']);
export type Sachkontenrahmen = z.infer<typeof SachkontenrahmenSchema>;

// ── Export batch entity ───────────────────────────────────────────────────────

export const ExportBatchSchema = z.object({
    exportBatchId: z.string().min(1),
    userId: z.string().min(1),
    periodStart: z.string(), // ISO date YYYY-MM-DD
    periodEnd: z.string(), // ISO date YYYY-MM-DD
    format: z.literal('DATEV_EXTF_7'),
    beraternummer: z.string().min(1).max(7),
    mandantennummer: z.string().min(1).max(5),
    sachkontenrahmen: SachkontenrahmenSchema,
    sachkontenlaenge: z.number().int().min(4).max(8),
    status: ExportBatchStatusSchema,
    validationReport: z.any().optional(),
    archiveS3Key: z.string().optional(),
    createdAt: z.string(),
    completedAt: z.string().optional(),
});
export type ExportBatch = z.infer<typeof ExportBatchSchema>;

// ── Validation report ─────────────────────────────────────────────────────────

export const ValidationWarningSchema = z.object({
    invoiceId: z.string(),
    field: z.string(),
    code: z.enum([
        'MISSING_VAT_RATE',
        'MISSING_INVOICE_NUMBER',
        'MISSING_INVOICE_DATE',
        'UNREADABLE_DATE',
        'MISSING_VENDOR',
        'MISSING_TOTAL',
        'MISSING_ACCOUNT_MAPPING',
        'ACCOUNT_LENGTH_MISMATCH',
        'ALREADY_EXPORTED',
    ]),
    message: z.string(),
});
export type ValidationWarning = z.infer<typeof ValidationWarningSchema>;

export const ValidationReportSchema = z.object({
    totalInvoices: z.number(),
    eligibleInvoices: z.number(),
    skippedInvoices: z.number(),
    warnings: z.array(ValidationWarningSchema),
    errors: z.array(ValidationWarningSchema),
    canProceed: z.boolean(),
});
export type ValidationReport = z.infer<typeof ValidationReportSchema>;

// ── Request / response DTOs ───────────────────────────────────────────────────

export const ExportPeriodSchema = z.object({
    type: z.enum(['month', 'quarter', 'year']),
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12).optional(), // required for month
    quarter: z.number().int().min(1).max(4).optional(), // required for quarter
});
export type ExportPeriod = z.infer<typeof ExportPeriodSchema>;

export const CreateExportRequestSchema = z.object({
    period: ExportPeriodSchema,
    beraternummer: z.string().min(1).max(7),
    mandantennummer: z.string().min(1).max(5),
    sachkontenrahmen: SachkontenrahmenSchema,
    sachkontenlaenge: z.number().int().min(4).max(8),
    includeDocumentReferences: z.boolean().default(false),
});
export type CreateExportRequest = z.infer<typeof CreateExportRequestSchema>;

export const ValidateExportRequestSchema = CreateExportRequestSchema;
export type ValidateExportRequest = z.infer<typeof ValidateExportRequestSchema>;

export const ExportDownloadResponseSchema = z.object({
    downloadUrl: z.string().url(),
    expiresAt: z.string(),
    archiveFilename: z.string(),
});
export type ExportDownloadResponse = z.infer<typeof ExportDownloadResponseSchema>;

// ── DATEV row ─────────────────────────────────────────────────────────────────

export const DatevRowSchema = z.object({
    Umsatz: z.string(), // total amount formatted as German decimal
    SollHaben: z.enum(['S', 'H']),
    Konto: z.string(),
    Gegenkonto: z.string().optional(),
    BUSchluessel: z.string().optional(),
    Belegdatum: z.string(), // DDMM
    Belegfeld1: z.string().optional(),
    Buchungstext: z.string().optional(),
    DocumentReference: z.string().optional(),
});
export type DatevRow = z.infer<typeof DatevRowSchema>;
