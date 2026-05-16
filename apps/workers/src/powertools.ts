import { BatchProcessor, EventType, processPartialResponse } from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { z } from 'zod';

export const logger = new Logger({ serviceName: 'smart-invoice-analyzer-workers' });
export const metrics = new Metrics({
    namespace: 'SmartInvoiceAnalyzer',
    serviceName: 'smart-invoice-analyzer-workers',
});
export const tracer = new Tracer({ serviceName: 'smart-invoice-analyzer-workers' });

export { processPartialResponse };
export const processor = new BatchProcessor(EventType.SQS);

// ── S3 event types (ingestion worker only) ────────────────────────────────────

export interface S3EventRecord {
    s3: { bucket: { name: string }; object: { key: string; size: number } };
}
export interface S3Event {
    Records: S3EventRecord[];
}

// ── Per-record JSON parser ────────────────────────────────────────────────────

export function parseRecord<T>(body: string, schema: z.ZodType<T>): T {
    let raw: unknown;
    try {
        raw = JSON.parse(body);
    } catch {
        throw new Error(`Invalid JSON in SQS record: ${body}`);
    }
    const result = schema.safeParse(raw);
    if (!result.success) throw new Error(`Schema validation failed: ${result.error.message}`);
    return result.data;
}
