import { APIGatewayProxyEventSchema } from '@aws-lambda-powertools/parser/schemas';
import { AppError } from '@smart-invoice-analyzer/errors';
import { z } from 'zod';

// ── Event type ────────────────────────────────────────────────────────────────
// Derived from the same Powertools schema used in the API middleware pipeline.
// Auth helpers and handlers share a single authoritative event type.

export type ParsedApiEvent = z.infer<typeof APIGatewayProxyEventSchema>;

// ── User context ──────────────────────────────────────────────────────────────

export interface UserContext {
    userId: string;
    email: string;
    username: string;
}

// ── Claim extraction ──────────────────────────────────────────────────────────

export function getUserContext(event: ParsedApiEvent): UserContext {
    const claims = (event.requestContext.authorizer as Record<string, unknown> | undefined)?.[
        'claims'
    ] as Record<string, string> | undefined;

    if (!claims?.['sub']) {
        throw new UnauthorizedError('Missing or invalid authorizer claims');
    }

    return {
        userId: claims['sub'],
        email: claims['email'] ?? claims['cognito:username'] ?? claims['sub'],
        username: claims['cognito:username'] ?? claims['email'] ?? claims['sub'],
    };
}

// ── Path / query param helpers ────────────────────────────────────────────────

export function requirePathParam(event: ParsedApiEvent, name: string): string {
    const value = event.pathParameters?.[name];
    if (!value) throw new ValidationError(`Missing path parameter: ${name}`);
    return value;
}

export function getQueryParam(event: ParsedApiEvent, name: string): string | undefined {
    return event.queryStringParameters?.[name] ?? undefined;
}

export function parseBody<T>(event: ParsedApiEvent, schema: z.ZodType<T>): T {
    if (!event.body) throw new ValidationError('Request body is required');

    let raw: unknown;
    try {
        raw = JSON.parse(event.body);
    } catch {
        throw new ValidationError('Request body must be valid JSON');
    }

    const result = schema.safeParse(raw);
    if (!result.success) {
        const issues = result.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join(', ');
        throw new ValidationError(`Invalid request body: ${issues}`);
    }

    return result.data;
}

// ── Error classes ─────────────────────────────────────────────────────────────

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 'UNAUTHORIZED', 401);
        this.name = 'UnauthorizedError';
    }
}

export class ValidationError extends AppError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, 'VALIDATION_ERROR', 400, context);
        this.name = 'ValidationError';
    }
}
