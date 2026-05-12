import { BatchProcessor, EventType, processPartialResponse } from '@aws-lambda-powertools/batch';
import { z } from 'zod';

// ── Re-exports for use in each handler ───────────────────────────────────────

export { processPartialResponse };

export const processor = new BatchProcessor(EventType.SQS);

// ── Minimal S3-event types (used only by the ingestion handler) ───────────────
// SQS types come from @aws-lambda-powertools/batch → aws-lambda.

export interface S3EventRecord {
    s3: {
        bucket: { name: string };
        object: { key: string; size: number };
    };
}

export interface S3Event {
    Records: S3EventRecord[];
}

// ── Per-record JSON parser ────────────────────────────────────────────────────
// Call this inside a batch recordHandler to parse + validate the SQS record body.

export function parseRecord<T>(body: string, schema: z.ZodType<T>): T {
    let raw: unknown;
    try {
        raw = JSON.parse(body);
    } catch {
        throw new Error(`Invalid JSON in SQS record body: ${body}`);
    }

    const result = schema.safeParse(raw);
    if (!result.success) {
        throw new Error(`Schema validation failed: ${result.error.message}`);
    }

    return result.data;
}
