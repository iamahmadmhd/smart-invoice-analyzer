import { z } from 'zod';

export const ExportJobStatusSchema = z.enum([
    'PENDING',
    'VALIDATING',
    'READY',
    'GENERATING',
    'COMPLETED',
    'FAILED',
]);
export type ExportJobStatus = z.infer<typeof ExportJobStatusSchema>;

export const ExportSchema = z.object({
    exportId: z.string().min(1),
    teamId: z.string().min(1),
    createdBy: z.string().min(1),
    periodStart: z.iso.date(),
    periodEnd: z.iso.date(),
    format: z.string(),
    status: ExportJobStatusSchema,
    validationReport: z.any().optional(),
    archiveS3Key: z.string().optional(),
    createdAt: z.iso.datetime(),
    completedAt: z.iso.datetime().optional(),
});
export type Export = z.infer<typeof ExportSchema>;

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

export const ExportPeriodSchema = z.object({
    type: z.enum(['month', 'quarter', 'year']),
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12).optional(),
    quarter: z.number().int().min(1).max(4).optional(),
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
    downloadUrl: z.url(),
    expiresAt: z.iso.datetime(),
    archiveFilename: z.string(),
});
export type ExportDownloadResponse = z.infer<typeof ExportDownloadResponseSchema>;
