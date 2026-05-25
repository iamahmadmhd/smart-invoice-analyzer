import { z } from 'zod';

const configSchema = z.object({
    STAGE: z.enum(['dev', 'staging', 'prod']).default('dev'),
    INVOICE_TABLE: z.string().min(1),
    PROCESSING_JOB_TABLE: z.string().min(1),
    EXPORT_TABLE: z.string().min(1),
    INSIGHT_TABLE: z.string().min(1),
    BUCKET_NAME: z.string().min(1),
    // Team tables — required by API handlers, optional for workers
    TEAM_TABLE: z.string().optional(),
    MEMBERSHIP_TABLE: z.string().optional(),
    INVITATION_TABLE: z.string().optional(),
    // Queue URLs
    OCR_QUEUE_URL: z.url().optional(),
    NORMALIZATION_QUEUE_URL: z.url().optional(),
    ENRICHMENT_QUEUE_URL: z.url().optional(),
    DUPLICATE_QUEUE_URL: z.url().optional(),
    ANOMALY_QUEUE_URL: z.url().optional(),
    EXPORT_QUEUE_URL: z.url().optional(),
    // AI
    BEDROCK_MODEL_ID: z.string().default('eu.anthropic.claude-haiku-4-5-20251001-v1:0'),
    BEDROCK_REGION: z.string().default('eu-central-1'),
    // S3 prefixes
    INVOICE_PREFIX: z.string().default('invoices/original/'),
    DERIVED_PREFIX: z.string().default('invoices/derived/'),
    EXPORT_PREFIX: z.string().default('exports/'),
    // Feature flags
    ENABLE_ANOMALY_DETECTION: z
        .string()
        .default('true')
        .transform((v) => v === 'true'),
    ENABLE_DUPLICATE_DETECTION: z
        .string()
        .default('true')
        .transform((v) => v === 'true'),
});

export type Config = z.infer<typeof configSchema>;

let _config: Config | undefined;

export function getConfig(): Config {
    if (_config) return _config;
    const result = configSchema.safeParse(process.env);
    if (!result.success) throw new Error(`Invalid env: ${result.error.message}`);
    _config = result.data;
    return _config;
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
    return { modelId: config.BEDROCK_MODEL_ID, region: config.BEDROCK_REGION };
}
