import { Invoice } from '@smart-invoice-analyzer/contracts';
import { logger } from '@smart-invoice-analyzer/observability';
import { z } from 'zod';
import { callBedrock } from './bedrock-client';

// ── Result schema ─────────────────────────────────────────────────────────────

const EnrichmentResultSchema = z.object({
    vendorName: z.string().nullable().optional(),
    invoiceNumber: z.string().nullable().optional(),
    invoiceDate: z.string().nullable().optional(), // YYYY-MM-DD
    dueDate: z.string().nullable().optional(),
    netAmount: z.number().nullable().optional(),
    taxAmount: z.number().nullable().optional(),
    taxRate: z.number().nullable().optional(),
    totalAmount: z.number().nullable().optional(),
    vatIdOrTaxNumber: z.string().nullable().optional(),
    category: z
        .enum([
            'software',
            'hardware',
            'office',
            'travel',
            'marketing',
            'utilities',
            'consulting',
            'other',
        ])
        .nullable()
        .optional(),
    confidenceScore: z.number().min(0).max(1),
    summary: z.string(),
});

export type EnrichmentResult = z.infer<typeof EnrichmentResultSchema>;

// ── Prompt ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert German accounting assistant.
You receive a partially-parsed invoice and the original OCR text.
Your tasks in a single pass:
1. Fill any null/missing fields you can determine from the OCR text.
2. Infer the expense category.
3. Assign an overall confidence score (0–1) based on data quality.
4. Write a concise 1–2 sentence English summary of the invoice.

Rules: dates YYYY-MM-DD, amounts as numbers, category one of: software, hardware, office, travel, marketing, utilities, consulting, other.
Only populate fields that are null in the partial invoice. Do not override already-filled values.`;

function buildPrompt(invoice: Partial<Invoice>, ocrText: string): string {
    const known = {
        vendorName: invoice.vendorName ?? null,
        invoiceNumber: invoice.invoiceNumber ?? null,
        invoiceDate: invoice.invoiceDate ?? null,
        dueDate: invoice.dueDate ?? null,
        netAmount: invoice.netAmount ?? null,
        taxAmount: invoice.taxAmount ?? null,
        taxRate: invoice.taxRate ?? null,
        totalAmount: invoice.totalAmount ?? null,
        vatIdOrTaxNumber: invoice.vatIdOrTaxNumber ?? null,
        category: invoice.category ?? null,
    };

    return `Partially-parsed invoice (null = missing):
${JSON.stringify(known, null, 2)}

Original OCR text:
<ocr_text>
${ocrText.slice(0, 3000)}
</ocr_text>

Return JSON with all fields from the partial invoice plus: confidenceScore, summary.`;
}

// ── Fallback ──────────────────────────────────────────────────────────────────

function fallbackResult(invoice: Partial<Invoice>): EnrichmentResult {
    return {
        confidenceScore: 0.3,
        summary: `Invoice from ${invoice.vendorName ?? 'unknown vendor'} for ${invoice.totalAmount ?? '?'} ${invoice.currency ?? 'EUR'}.`,
    };
}

// ── Main function ─────────────────────────────────────────────────────────────

export async function enrichInvoice(invoice: Invoice, ocrText: string): Promise<EnrichmentResult> {
    logger.info('Enriching invoice via AI', { invoiceId: invoice.invoiceId });

    const raw = await callBedrock(
        buildPrompt(invoice, ocrText),
        { system: SYSTEM_PROMPT, maxTokens: 512, temperature: 0.0, prefill: '{' },
        JSON.stringify(fallbackResult(invoice))
    );

    try {
        const parsed = JSON.parse('{' + raw.trim());
        const result = EnrichmentResultSchema.safeParse(parsed);
        if (!result.success) {
            logger.warn('Enrichment schema validation failed', { issues: result.error.issues });
            return fallbackResult(invoice);
        }
        return result.data;
    } catch {
        logger.error('Failed to parse enrichment JSON', { raw });
        return fallbackResult(invoice);
    }
}

/**
 * Merge enrichment result into an existing invoice, only filling missing fields.
 * confidenceScore and summary are always applied (they are enrichment products,
 * not structural fields that normalization would have set).
 */
export function mergeEnrichmentIntoInvoice(
    invoice: Invoice,
    enrichment: EnrichmentResult
): Partial<Invoice> {
    const patch: Partial<Invoice> = {};

    if (!invoice.vendorName && enrichment.vendorName) patch.vendorName = enrichment.vendorName;
    if (!invoice.invoiceNumber && enrichment.invoiceNumber)
        patch.invoiceNumber = enrichment.invoiceNumber;
    if (!invoice.invoiceDate && enrichment.invoiceDate) patch.invoiceDate = enrichment.invoiceDate;
    if (!invoice.dueDate && enrichment.dueDate) patch.dueDate = enrichment.dueDate;
    if (!invoice.netAmount && enrichment.netAmount) patch.netAmount = enrichment.netAmount;
    if (!invoice.taxAmount && enrichment.taxAmount) patch.taxAmount = enrichment.taxAmount;
    if (!invoice.taxRate && enrichment.taxRate) patch.taxRate = enrichment.taxRate;
    if (!invoice.totalAmount && enrichment.totalAmount) patch.totalAmount = enrichment.totalAmount;
    if (!invoice.vatIdOrTaxNumber && enrichment.vatIdOrTaxNumber)
        patch.vatIdOrTaxNumber = enrichment.vatIdOrTaxNumber;
    if (!invoice.category && enrichment.category) patch.category = enrichment.category;

    // Always apply — these are enrichment-only fields
    patch.confidenceScore = enrichment.confidenceScore;

    return patch;
}
