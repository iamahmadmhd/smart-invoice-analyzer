import { z } from 'zod';

// ── Base worker event ─────────────────────────────────────────────────────────

const BaseWorkerEventSchema = z.object({
    invoiceId: z.string().min(1),
    userId: z.string().min(1),
    jobId: z.string().min(1),
    correlationId: z.string(),
    attempt: z.number().int().min(1).default(1),
});

// ── Per-worker payloads ───────────────────────────────────────────────────────

export const IngestionEventSchema = BaseWorkerEventSchema.extend({
    s3Key: z.string().min(1),
    s3Bucket: z.string().min(1),
    contentType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
    fileSizeBytes: z.number().positive(),
});
export type IngestionEvent = z.infer<typeof IngestionEventSchema>;

export const OcrEventSchema = BaseWorkerEventSchema.extend({
    s3Key: z.string().min(1),
    s3Bucket: z.string().min(1),
    contentType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
});
export type OcrEvent = z.infer<typeof OcrEventSchema>;

export const NormalizationEventSchema = BaseWorkerEventSchema.extend({
    rawOutputS3Key: z.string().min(1), // Textract output stored in S3
});
export type NormalizationEvent = z.infer<typeof NormalizationEventSchema>;

export const EnrichmentEventSchema = BaseWorkerEventSchema.extend({});
export type EnrichmentEvent = z.infer<typeof EnrichmentEventSchema>;

export const DuplicateEventSchema = BaseWorkerEventSchema.extend({});
export type DuplicateEvent = z.infer<typeof DuplicateEventSchema>;

export const AnomalyEventSchema = BaseWorkerEventSchema.extend({});
export type AnomalyEvent = z.infer<typeof AnomalyEventSchema>;

export const ExportWorkerEventSchema = z.object({
    exportBatchId: z.string().min(1),
    userId: z.string().min(1),
    correlationId: z.string(),
    includeDocumentReferences: z.boolean().default(false),
});
export type ExportWorkerEvent = z.infer<typeof ExportWorkerEventSchema>;

// ── Processing job entity ─────────────────────────────────────────────────────

export const ProcessingStageSchema = z.enum([
    'INGESTION',
    'OCR',
    'NORMALIZATION',
    'ENRICHMENT',
    'DUPLICATE',
    'ANOMALY',
]);
export type ProcessingStage = z.infer<typeof ProcessingStageSchema>;

export const ProcessingJobStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']);
export type ProcessingJobStatus = z.infer<typeof ProcessingJobStatusSchema>;

export const ProcessingJobSchema = z.object({
    jobId: z.string().min(1),
    invoiceId: z.string().min(1),
    userId: z.string().min(1),
    stage: ProcessingStageSchema,
    status: ProcessingJobStatusSchema,
    retryCount: z.number().int().min(0).default(0),
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),
    startedAt: z.string(),
    completedAt: z.string().optional(),
    ttl: z.number().optional(), // Unix epoch — auto-expires after 90 days
});
export type ProcessingJob = z.infer<typeof ProcessingJobSchema>;
