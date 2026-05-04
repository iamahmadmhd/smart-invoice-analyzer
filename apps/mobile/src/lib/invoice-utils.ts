import { Invoice } from '@smart-invoice-analyzer/contracts';

export function mapInvoiceStatus(
    status: Invoice['status']
): 'pending' | 'processing' | 'completed' | 'failed' | 'duplicate' | 'anomaly' {
    if (status === 'COMPLETED') return 'completed';
    if (status.startsWith('FAILED')) return 'failed';
    if (['UPLOADED', 'PROCESSING', 'EXTRACTED', 'ENRICHED', 'REVIEW_READY'].includes(status))
        return 'processing';
    return 'pending';
}

export function getStatusLabel(status: Invoice['status']): string {
    const map: Record<string, string> = {
        UPLOADED: 'Uploaded',
        PROCESSING: 'Processing',
        EXTRACTED: 'Extracted',
        ENRICHED: 'Enriched',
        REVIEW_READY: 'Review Ready',
        COMPLETED: 'Completed',
        FAILED_OCR: 'OCR Failed',
        FAILED_VALIDATION: 'Validation Failed',
        FAILED_AI: 'AI Failed',
        FAILED_INTERNAL: 'Internal Error',
    };
    return map[status] ?? status;
}

export function getConfidenceColor(score: number): 'success' | 'warning' | 'error' {
    if (score >= 0.75) return 'success';
    if (score >= 0.5) return 'warning';
    return 'error';
}

export function getConfidenceBarColor(score: number): string {
    if (score >= 0.75) return 'bg-jade';
    if (score >= 0.5) return 'bg-amber';
    return 'bg-crimson';
}
