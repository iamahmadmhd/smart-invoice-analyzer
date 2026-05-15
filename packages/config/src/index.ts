import { z } from 'zod';

const configSchema = z.object({
    STAGE: z.enum(['dev', 'staging', 'prod']).default('dev'),
    INVOICE_TABLE: z.string().min(1),
    PROCESSING_JOB_TABLE: z.string().min(1),
    EXPORT_TABLE: z.string().min(1),
    INSIGHT_TABLE: z.string().min(1),
    USER_TABLE: z.string().min(1),
    TEAM_TABLE: z.string().min(1),
    MEMBERSHIP_TABLE: z.string().min(1),
    INVITATION_TABLE: z.string().min(1),
    BUCKET_NAME: z.string().min(1),
    OCR_QUEUE_URL: z.string().url().optional(),
    NORMALIZATION_QUEUE_URL: z.string().url().optional(),
    ENRICHMENT_QUEUE_URL: z.string().url().optional(),
    DUPLICATE_QUEUE_URL: z.string().url().optional(),
    ANOMALY_QUEUE_URL: z.string().url().optional(),
    EXPORT_QUEUE_URL: z.string().url().optional(),
    BEDROCK_MODEL_ID: z.string().default('eu.anthropic.claude-haiku-4-5-20251001-v1:0'),
    BEDROCK_REGION: z.string().default('eu-central-1'),
    INVOICE_PREFIX: z.string().default('invoices/original/'),
    DERIVED_PREFIX: z.string().default('invoices/derived/'),
    EXPORT_PREFIX: z.string().default('exports/'),
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
