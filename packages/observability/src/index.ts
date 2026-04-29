import { getConfig } from '@smart-invoice-analyzer/config';

// ── Correlation context ───────────────────────────────────────────────────────

let _correlationId: string = 'unset';
let _userId: string | undefined;

export function setCorrelationId(id: string): void {
    _correlationId = id;
}

export function setUserId(id: string): void {
    _userId = id;
}

export function getCorrelationId(): string {
    return _correlationId;
}

// ── Shared HTTP headers ───────────────────────────────────────────────────────
// Single source of truth consumed by both withObservability (error paths)
// and apps/api/src/utils/response.ts (success paths).

export const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
        'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    ...CORS_HEADERS,
};

// ── Log levels ────────────────────────────────────────────────────────────────

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LEVEL_RANK: Record<LogLevel, number> = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

function getMinLevel(): LogLevel {
    try {
        const stage = getConfig().STAGE;
        return stage === 'prod' ? 'INFO' : 'DEBUG';
    } catch {
        return 'DEBUG';
    }
}

// ── Structured log entry ──────────────────────────────────────────────────────

interface LogEntry {
    level: LogLevel;
    message: string;
    correlationId: string;
    userId?: string;
    timestamp: string;
    [key: string]: unknown;
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (LEVEL_RANK[level] < LEVEL_RANK[getMinLevel()]) return;

    const entry: LogEntry = {
        level,
        message,
        correlationId: _correlationId,
        userId: _userId,
        timestamp: new Date().toISOString(),
        ...context,
    };

    const out = JSON.stringify(entry);

    if (level === 'ERROR' || level === 'WARN') {
        console.error(out);
    } else {
        console.log(out);
    }
}

// ── Logger ────────────────────────────────────────────────────────────────────

export const logger = {
    debug: (message: string, context?: Record<string, unknown>) => emit('DEBUG', message, context),
    info: (message: string, context?: Record<string, unknown>) => emit('INFO', message, context),
    warn: (message: string, context?: Record<string, unknown>) => emit('WARN', message, context),
    error: (message: string, context?: Record<string, unknown>) => emit('ERROR', message, context),
};

// ── Error wrapping ────────────────────────────────────────────────────────────

export class AppError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode: number = 500,
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string, id: string) {
        super(`${resource} not found: ${id}`, 'NOT_FOUND', 404, { resource, id });
        this.name = 'NotFoundError';
    }
}

export class ValidationError extends AppError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, 'VALIDATION_ERROR', 400, context);
        this.name = 'ValidationError';
    }
}

export class ConflictError extends AppError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, 'CONFLICT', 409, context);
        this.name = 'ConflictError';
    }
}

export function serializeError(error: unknown): Record<string, unknown> {
    if (error instanceof AppError) {
        return {
            name: error.name,
            code: error.code,
            message: error.message,
            statusCode: error.statusCode,
            context: error.context,
        };
    }
    if (error instanceof Error) {
        return { name: error.name, message: error.message, stack: error.stack };
    }
    return { raw: String(error) };
}

// ── Lambda handler wrapper ────────────────────────────────────────────────────

interface ApiGatewayEvent {
    requestContext?: { requestId?: string };
    headers?: Record<string, string | undefined>;
    httpMethod?: string;
    path?: string;
}

interface LambdaResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}

type ApiHandler = (event: ApiGatewayEvent) => Promise<LambdaResponse>;

export function withObservability(handler: ApiHandler): ApiHandler {
    return async (event: ApiGatewayEvent): Promise<LambdaResponse> => {
        const correlationId = event.requestContext?.requestId ?? `local-${Date.now()}`;
        setCorrelationId(correlationId);

        logger.info('Request started', {
            method: event.httpMethod,
            path: event.path,
        });

        const start = Date.now();

        try {
            const response = await handler(event);

            logger.info('Request completed', {
                statusCode: response.statusCode,
                durationMs: Date.now() - start,
            });

            return {
                ...response,
                headers: { ...defaultHeaders, ...response.headers },
            };
        } catch (error) {
            const serialized = serializeError(error);

            logger.error('Unhandled error', {
                error: serialized,
                durationMs: Date.now() - start,
            });

            if (error instanceof AppError) {
                return {
                    statusCode: error.statusCode,
                    headers: defaultHeaders,
                    body: JSON.stringify({ error: error.code, message: error.message }),
                };
            }

            return {
                statusCode: 500,
                headers: defaultHeaders,
                body: JSON.stringify({
                    error: 'INTERNAL_ERROR',
                    message: 'An unexpected error occurred',
                }),
            };
        }
    };
}

// ── Metrics helpers (CloudWatch EMF) ─────────────────────────────────────────

interface MetricOptions {
    unit?: 'Count' | 'Milliseconds' | 'Bytes' | 'None';
    dimensions?: Record<string, string>;
}

export function emitMetric(name: string, value: number, options: MetricOptions = {}): void {
    try {
        const stage = getConfig().STAGE;
        const { unit = 'Count', dimensions = {} } = options;

        const emfPayload = {
            _aws: {
                Timestamp: Date.now(),
                CloudWatchMetrics: [
                    {
                        Namespace: `SmartInvoiceAnalyzer/${stage}`,
                        Dimensions: [Object.keys({ stage, ...dimensions })],
                        Metrics: [{ Name: name, Unit: unit }],
                    },
                ],
            },
            stage,
            ...dimensions,
            [name]: value,
        };
    } catch {
        // Never let metric emission crash a handler
    }
}
