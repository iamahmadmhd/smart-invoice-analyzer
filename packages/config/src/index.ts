import { z } from 'zod';

// ── Environment schema ────────────────────────────────────────────────────────

const configSchema = z.object({
    // Stage
    STAGE: z.enum(['dev', 'staging', 'prod']).default('dev'),

    // DynamoDB tables
    INVOICE_TABLE: z.string().min(1),
    PROCESSING_JOB_TABLE: z.string().min(1),
    EXPORT_BATCH_TABLE: z.string().min(1),
    INSIGHT_TABLE: z.string().min(1),
    USER_TABLE: z.string().min(1),

    // S3
    BUCKET_NAME: z.string().min(1),

    // SQS queue URLs — optional so API handlers don't require all of them
    OCR_QUEUE_URL: z.string().url().optional(),
    NORMALIZATION_QUEUE_URL: z.string().url().optional(),
    ENRICHMENT_QUEUE_URL: z.string().url().optional(),
    DUPLICATE_QUEUE_URL: z.string().url().optional(),
    ANOMALY_QUEUE_URL: z.string().url().optional(),
    EXPORT_QUEUE_URL: z.string().url().optional(),

    // AWS Bedrock
    BEDROCK_MODEL_ID: z.string().default('anthropic.claude-3-5-sonnet-20241022-v2:0'),
    BEDROCK_REGION: z.string().default('eu-central-1'),

    // S3 prefixes
    INVOICE_PREFIX: z.string().default('invoices/original/'),
    DERIVED_PREFIX: z.string().default('invoices/derived/'),
    EXPORT_PREFIX: z.string().default('exports/'),

    // Feature flags
    ENABLE_ANOMALY_DETECTION: z
        .string()
        .transform((v) => v === 'true')
        .default('true'),
    ENABLE_DUPLICATE_DETECTION: z
        .string()
        .transform((v) => v === 'true')
        .default('true'),
});

export type Config = z.infer<typeof configSchema>;

// ── Loader ────────────────────────────────────────────────────────────────────
// Call once at Lambda cold-start. Throws with a clear message if any required
// env var is missing so misconfigured deployments fail fast.

let _config: Config | undefined;

export function getConfig(): Config {
    if (_config) return _config;

    const result = configSchema.safeParse(process.env);

    if (!result.success) {
        const issues = result.error.issues
            .map((i) => `  ${i.path.join('.')}: ${i.message}`)
            .join('\n');
        throw new Error(`Invalid environment configuration:\n${issues}`);
    }

    _config = result.data;
    return _config;
}

// ── Per-section accessors (convenience) ──────────────────────────────────────

export function getTableNames(config: Config) {
    return {
        invoiceTable: config.INVOICE_TABLE,
        processingJobTable: config.PROCESSING_JOB_TABLE,
        exportBatchTable: config.EXPORT_BATCH_TABLE,
        insightTable: config.INSIGHT_TABLE,
        userTable: config.USER_TABLE,
    };
}

export function getQueueUrls(config: Config) {
    return {
        ocrQueue: config.OCR_QUEUE_URL,
        normalizationQueue: config.NORMALIZATION_QUEUE_URL,
        enrichmentQueue: config.ENRICHMENT_QUEUE_URL,
        duplicateQueue: config.DUPLICATE_QUEUE_URL,
        anomalyQueue: config.ANOMALY_QUEUE_URL,
        exportQueue: config.EXPORT_QUEUE_URL,
    };
}

export function getS3Config(config: Config) {
    return {
        bucketName: config.BUCKET_NAME,
        invoicePrefix: config.INVOICE_PREFIX,
        derivedPrefix: config.DERIVED_PREFIX,
        exportPrefix: config.EXPORT_PREFIX,
    };
}

export function getBedrockConfig(config: Config) {
    return {
        modelId: config.BEDROCK_MODEL_ID,
        region: config.BEDROCK_REGION,
    };
}
