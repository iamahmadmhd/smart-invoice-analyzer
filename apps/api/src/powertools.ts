import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { parser } from '@aws-lambda-powertools/parser/middleware';
import { APIGatewayProxyEventSchema } from '@aws-lambda-powertools/parser/schemas';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import middy from '@middy/core';
import { AppError } from '@smart-invoice-analyzer/errors';
import type { Context } from 'aws-lambda';
import { z } from 'zod';

// ── Shared Powertools instances ───────────────────────────────────────────────

export const logger = new Logger({ serviceName: 'smart-invoice-analyzer-api' });
export const tracer = new Tracer({ serviceName: 'smart-invoice-analyzer-api' });
export const metrics = new Metrics({
    namespace: 'SmartInvoiceAnalyzer',
    serviceName: 'smart-invoice-analyzer-api',
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type ParsedApiEvent = z.infer<typeof APIGatewayProxyEventSchema>;

export interface ApiResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}

// ── Default headers ───────────────────────────────────────────────────────────

export const DEFAULT_HEADERS: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
        'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

// ── Error handler middleware ──────────────────────────────────────────────────

const errorHandlerMiddleware = (): middy.MiddlewareObj<ParsedApiEvent, ApiResponse> => ({
    onError: async (request) => {
        const error = request.error;
        logger.error('Unhandled error', { error: String(error) });

        if (error instanceof AppError) {
            request.response = {
                statusCode: error.statusCode,
                headers: DEFAULT_HEADERS,
                body: JSON.stringify({ error: error.code, message: error.message }),
            };
            return;
        }

        request.response = {
            statusCode: 500,
            headers: DEFAULT_HEADERS,
            body: JSON.stringify({
                error: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred',
            }),
        };
    },
});

// ── createHandler ─────────────────────────────────────────────────────────────
// Uses the middy `.handler()` chain so the parser middleware's type narrowing
// (unknown → ParsedApiEvent) flows correctly through the generic chain.
// Observability middlewares run first (before parsing) so they always capture
// invocation context; the parser fires next to validate and transform the event.

export function createHandler(
    fn: (event: ParsedApiEvent, context: Context) => Promise<ApiResponse>
) {
    return middy<ParsedApiEvent, ApiResponse, Error, Context>()
        .use(injectLambdaContext(logger, { clearState: true }))
        .use(captureLambdaHandler(tracer))
        .use(logMetrics(metrics))
        .use(parser({ schema: APIGatewayProxyEventSchema }))
        .use(errorHandlerMiddleware())
        .handler(fn);
}
