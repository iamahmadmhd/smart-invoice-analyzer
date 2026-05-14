import { z } from 'zod';

// ── Enums ─────────────────────────────────────────────────────────────────────

// Named ExportJobStatus to avoid collision with invoice's ExportStatus (NOT_EXPORTED | EXPORTED)
export const ExportJobStatusSchema = z.enum([
    'PENDING',
    'VALIDATING',
    'READY',
    'GENERATING',
    'COMPLETED',
    'FAILED',
]);
export type ExportJobStatus = z.infer<typeof ExportJobStatusSchema>;

// ── Export entity ─────────────────────────────────────────────────────────────

export const ExportSchema = z.object({
    exportId: z.string().min(1),
    teamId: z.string().min(1),
    createdBy: z.string().min(1), // userId of the member who triggered the export
    periodStart: z.date(),
    periodEnd: z.date(),
    format: z.string(),
    status: ExportJobStatusSchema,
    validationReport: z.any().optional(),
    archiveS3Key: z.string().optional(),
    createdAt: z.string(),
    completedAt: z.string().optional(),
});
export type Export = z.infer<typeof ExportSchema>;

// ── Validation report ─────────────────────────────────────────────────────────

export const ValidationWarningSchema = z.object({
    invoiceId: z.string(),
    field: z.string(),
    code: z.enum([
        'MISSING_INVOICE_NUMBER',
        'MISSING_INVOICE_DATE',
        'UNREADABLE_DATE',
        'MISSING_VENDOR',
        'MISSING_TOTAL',
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
