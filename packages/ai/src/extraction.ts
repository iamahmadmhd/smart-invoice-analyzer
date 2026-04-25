import { Invoice } from '@smart-invoice-analyzer/contracts';
import { logger } from '@smart-invoice-analyzer/observability';
import { z } from 'zod';
import { callBedrock } from './bedrock-client.js';

// ── Schema for structured extraction output ───────────────────────────────────

const ExtractionResultSchema = z.object({
    vendorName: z.string().optional(),
    invoiceNumber: z.string().optional(),
    invoiceDate: z.string().optional(), // YYYY-MM-DD
    dueDate: z.string().optional(), // YYYY-MM-DD
    currency: z.string().default('EUR'),
    netAmount: z.number().optional(),
    taxAmount: z.number().optional(),
    taxRate: z.number().optional(), // e.g. 19
    totalAmount: z.number().optional(),
    vatIdOrTaxNumber: z.string().optional(),
    category: z.string().optional(),
    confidenceScore: z.number().min(0).max(1).optional(),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

const SYSTEM_PROMPT = `You are an expert German accounting assistant specialising in invoice data extraction.
Extract structured fields from the provided OCR text of a German invoice.
Respond ONLY with a valid JSON object — no markdown fences, no explanation.
Use null for fields you cannot determine. Dates must be YYYY-MM-DD. Amounts must be numbers (not strings).
For confidenceScore, rate 0-1 based on how clearly the text contained the fields.
Category must be one of: software, hardware, office, travel, marketing, utilities, consulting, other.`;

const USER_TEMPLATE = (ocrText: string) => `Extract invoice fields from this OCR text:

<ocr_text>
${ocrText}
</ocr_text>

Return a JSON object with these fields:
vendorName, invoiceNumber, invoiceDate, dueDate, currency, netAmount, taxAmount, taxRate, totalAmount, vatIdOrTaxNumber, category, confidenceScore`;

export async function extractInvoiceFields(ocrText: string): Promise<ExtractionResult> {
    logger.info('Extracting invoice fields via AI', { ocrLength: ocrText.length });

    const raw = await callBedrock(
        USER_TEMPLATE(ocrText),
        {
            system: SYSTEM_PROMPT,
            maxTokens: 512,
            temperature: 0.0,
        },
        '{}'
    );

    try {
        const parsed = JSON.parse(raw.trim());
        const result = ExtractionResultSchema.safeParse(parsed);
        if (!result.success) {
            logger.warn('Extraction schema validation failed, using partial result', {
                issues: result.error.issues,
            });
            return ExtractionResultSchema.parse({ currency: 'EUR' });
        }
        return result.data;
    } catch {
        logger.error('Failed to parse extraction JSON', { raw });
        return ExtractionResultSchema.parse({ currency: 'EUR' });
    }
}

/**
 * Merge AI extraction results into an existing invoice, only filling missing fields.
 */
export function mergeExtractionIntoInvoice(
    invoice: Invoice,
    extraction: ExtractionResult
): Partial<Invoice> {
    const patch: Partial<Invoice> = {};

    if (!invoice.vendorName && extraction.vendorName) patch.vendorName = extraction.vendorName;
    if (!invoice.invoiceNumber && extraction.invoiceNumber)
        patch.invoiceNumber = extraction.invoiceNumber;
    if (!invoice.invoiceDate && extraction.invoiceDate) patch.invoiceDate = extraction.invoiceDate;
    if (!invoice.dueDate && extraction.dueDate) patch.dueDate = extraction.dueDate;
    if (!invoice.netAmount && extraction.netAmount) patch.netAmount = extraction.netAmount;
    if (!invoice.taxAmount && extraction.taxAmount) patch.taxAmount = extraction.taxAmount;
    if (!invoice.taxRate && extraction.taxRate) patch.taxRate = extraction.taxRate;
    if (!invoice.totalAmount && extraction.totalAmount) patch.totalAmount = extraction.totalAmount;
    if (!invoice.vatIdOrTaxNumber && extraction.vatIdOrTaxNumber)
        patch.vatIdOrTaxNumber = extraction.vatIdOrTaxNumber;
    if (!invoice.category && extraction.category) patch.category = extraction.category;
    if (extraction.confidenceScore !== undefined)
        patch.confidenceScore = extraction.confidenceScore;

    return patch;
}
