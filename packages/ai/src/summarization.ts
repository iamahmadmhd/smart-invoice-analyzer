import { Invoice } from '@smart-invoice-analyzer/contracts';
import { logger } from '@smart-invoice-analyzer/observability';
import { callBedrock } from './bedrock-client.js';

const SYSTEM_PROMPT = `You are a concise German accounting assistant.
Generate a short 1-2 sentence summary of the invoice for the user.
Write in English. Be factual and direct. No markdown.`;

export async function generateInvoiceSummary(invoice: Invoice): Promise<string> {
    logger.info('Generating invoice summary', { invoiceId: invoice.invoiceId });

    const context = [
        invoice.vendorName ? `Vendor: ${invoice.vendorName}` : null,
        invoice.invoiceNumber ? `Invoice #${invoice.invoiceNumber}` : null,
        invoice.invoiceDate ? `Date: ${invoice.invoiceDate}` : null,
        invoice.totalAmount ? `Total: ${invoice.totalAmount} ${invoice.currency}` : null,
        invoice.taxRate ? `VAT: ${invoice.taxRate}%` : null,
        invoice.category ? `Category: ${invoice.category}` : null,
    ]
        .filter(Boolean)
        .join(', ');

    const prompt = `Summarise this invoice in 1-2 sentences: ${context}`;

    return callBedrock(
        prompt,
        { system: SYSTEM_PROMPT, maxTokens: 150, temperature: 0.3 },
        `Invoice from ${invoice.vendorName ?? 'unknown vendor'} for ${invoice.totalAmount ?? '?'} ${invoice.currency}.`
    );
}
