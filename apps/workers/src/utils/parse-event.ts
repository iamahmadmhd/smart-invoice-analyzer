import { logger } from '@smart-invoice-analyzer/observability';
import { z } from 'zod';

export interface SQSRecord {
    body: string;
    messageId: string;
    receiptHandle: string;
}

export interface SQSEvent {
    Records: SQSRecord[];
}

export function parseWorkerEvent<T>(event: SQSEvent, schema: z.ZodType<T>): T {
    const record = event.Records[0];
    if (!record) throw new Error('No SQS records in event');

    let raw: unknown;
    try {
        raw = JSON.parse(record.body);
    } catch {
        throw new Error(`Invalid JSON in SQS message: ${record.body}`);
    }

    const result = schema.safeParse(raw);
    if (!result.success) {
        logger.error('Worker event schema validation failed', {
            issues: result.error.issues,
            raw,
        });
        throw new Error(`Invalid worker event: ${result.error.message}`);
    }

    return result.data;
}
