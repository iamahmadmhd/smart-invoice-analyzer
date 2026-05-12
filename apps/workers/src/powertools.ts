import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';

// ── Shared Powertools instances ───────────────────────────────────────────────
// Created at module scope so they are reused across warm Lambda invocations.

export const logger = new Logger({ serviceName: 'smart-invoice-analyzer-workers' });
export const metrics = new Metrics({
    namespace: 'SmartInvoiceAnalyzer',
    serviceName: 'smart-invoice-analyzer-workers',
});
export const tracer = new Tracer({ serviceName: 'smart-invoice-analyzer-workers' });
