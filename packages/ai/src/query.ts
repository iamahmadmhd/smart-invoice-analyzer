import { Invoice } from '@smart-invoice-analyzer/contracts';
import { logger } from '@smart-invoice-analyzer/observability';
import { z } from 'zod';
import { callBedrock } from './bedrock-client';

// ── Reliability scoring ───────────────────────────────────────────────────────

export type ReliabilityLabel = 'HIGH' | 'MEDIUM' | 'LOW';

function scoreReliability(invoiceCount: number, hasAggregates: boolean): ReliabilityLabel {
    if (invoiceCount === 0) return 'LOW';
    if (invoiceCount >= 5 && hasAggregates) return 'HIGH';
    return 'MEDIUM';
}

// ── Structured query intent ───────────────────────────────────────────────────

const QueryIntentSchema = z.object({
    type: z.enum([
        'spending_total',
        'vendor_lookup',
        'category_breakdown',
        'anomaly_list',
        'general',
    ]),
    filters: z
        .object({
            vendorName: z.string().optional(),
            category: z.string().optional(),
            dateFrom: z.string().optional(),
            dateTo: z.string().optional(),
        })
        .optional(),
});

export type QueryIntent = z.infer<typeof QueryIntentSchema>;

const INTENT_SYSTEM = `You parse natural-language questions about invoices into a structured JSON intent.
Respond ONLY with valid JSON, no markdown, no explanation.`;

export async function parseQueryIntent(question: string): Promise<QueryIntent> {
    const prompt = `Parse this question into a query intent JSON:
Question: "${question}"

Return: { "type": "spending_total"|"vendor_lookup"|"category_breakdown"|"anomaly_list"|"general", "filters": { "vendorName"?, "category"?, "dateFrom"?, "dateTo"? } }`;

    const raw = await callBedrock(
        prompt,
        { system: INTENT_SYSTEM, maxTokens: 256, temperature: 0 },
        '{"type":"general"}'
    );

    try {
        const parsed = JSON.parse(raw.trim());
        const result = QueryIntentSchema.safeParse(parsed);
        return result.success ? result.data : { type: 'general' };
    } catch {
        return { type: 'general' };
    }
}

// ── Answer synthesis ──────────────────────────────────────────────────────────

const ANSWER_SYSTEM = `You are a helpful accounting assistant. Answer the user's question based ONLY on the provided invoice data.
Be concise, factual, and specific. Mention totals, vendors, or dates as relevant. No markdown.
If the data is insufficient, say so briefly.`;

export interface QueryAnswerOptions {
    question: string;
    invoices: Invoice[];
    aggregates?: Record<string, unknown>;
}

export interface QueryAnswer {
    answer: string;
    reliabilityScore: number;
    reliabilityLabel: ReliabilityLabel;
    disclaimer?: string;
}

export async function synthesizeAnswer(options: QueryAnswerOptions): Promise<QueryAnswer> {
    const { question, invoices, aggregates } = options;
    logger.info('Synthesizing query answer', { question, invoiceCount: invoices.length });

    const dataContext = JSON.stringify({
        invoiceCount: invoices.length,
        invoices: invoices.slice(0, 20).map((i) => ({
            vendor: i.vendorName,
            date: i.invoiceDate,
            total: i.totalAmount,
            currency: i.currency,
            category: i.category,
            status: i.status,
        })),
        aggregates,
    });

    const prompt = `Invoice data: ${dataContext}

User question: "${question}"

Answer based only on the data above.`;

    const answer = await callBedrock(
        prompt,
        { system: ANSWER_SYSTEM, maxTokens: 300, temperature: 0.2 },
        'I was unable to generate an answer based on the available data.'
    );

    const label = scoreReliability(invoices.length, !!aggregates);
    const score = label === 'HIGH' ? 0.9 : label === 'MEDIUM' ? 0.6 : 0.3;

    return {
        answer,
        reliabilityScore: score,
        reliabilityLabel: label,
        disclaimer:
            label === 'LOW' ? 'Answer is based on limited data and may be incomplete.' : undefined,
    };
}
