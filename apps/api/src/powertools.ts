import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { AppError, serializeError } from '@smart-invoice-analyzer/errors';

// ── Shared Powertools instances ───────────────────────────────────────────────
// Created at module scope so they are reused across warm Lambda invocations.

export const logger = new Logger({ serviceName: 'smart-invoice-analyzer-api' });
export const metrics = new Metrics({
    namespace: 'SmartInvoiceAnalyzer',
    serviceName: 'smart-invoice-analyzer-api',
});
export const tracer = new Tracer({ serviceName: 'smart-invoice-analyzer-api' });

// ── CORS / default headers ────────────────────────────────────────────────────

const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
        'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

// ── Handler wrapper ───────────────────────────────────────────────────────────
// Drop-in replacement for the old withObservability from @smart-invoice-analyzer/observability.
// Logs request/response, injects correlationId into every log entry via appendKeys,
// and maps AppError subclasses to their HTTP status codes.

interface ApiEvent {
    requestContext?: { requestId?: string };
    headers?: Record<string, string | undefined>;
    httpMethod?: string;
    path?: string;
}

interface ApiResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}

type ApiHandler = (event: ApiEvent) => Promise<ApiResponse>;

export function withApiHandler(handler: ApiHandler): ApiHandler {
    return async (event: ApiEvent): Promise<ApiResponse> => {
        const correlationId = event.requestContext?.requestId ?? `local-${Date.now()}`;
        logger.appendKeys({ correlationId });

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
            logger.error('Unhandled error', {
                error: serializeError(error),
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
