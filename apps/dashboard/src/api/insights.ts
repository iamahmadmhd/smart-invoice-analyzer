import { apiClient } from '@/lib/api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type InsightType = 'SUMMARY' | 'DUPLICATE' | 'ANOMALY' | 'CATEGORY';

export interface Insight {
    insightId: string;
    teamId: string;
    invoiceId: string;
    type: InsightType;
    payload: Record<string, unknown>;
    createdAt: string;
}

// ── Typed payloads ────────────────────────────────────────────────────────────

export interface SummaryPayload {
    summary: string;
}

export interface DuplicatePayload {
    duplicateOfInvoiceId: string;
    reasons: Array<string>;
}

export interface AnomalyPayload {
    reasons: Array<string>;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export function getInsights(
    teamId: string,
    invoiceId: string
): Promise<{ insights: Array<Insight> }> {
    return apiClient.get<{ insights: Array<Insight> }>(
        `/teams/${teamId}/invoices/${invoiceId}/insights`
    );
}
