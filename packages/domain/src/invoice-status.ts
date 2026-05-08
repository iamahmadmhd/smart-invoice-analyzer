import { InvoiceStatus } from '@smart-invoice-analyzer/contracts';
import { ValidationError } from '@smart-invoice-analyzer/observability';

// ── Allowed transitions ───────────────────────────────────────────────────────

const TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
    UPLOADED: ['PROCESSING', 'FAILED_INTERNAL'],
    PROCESSING: ['EXTRACTED', 'FAILED_OCR', 'FAILED_INTERNAL'],
    EXTRACTED: ['ENRICHED', 'FAILED_AI', 'FAILED_VALIDATION'],
    ENRICHED: ['REVIEW_READY', 'FAILED_AI'],
    REVIEW_READY: ['COMPLETED'],
    COMPLETED: [],
    FAILED_OCR: ['PROCESSING'], // allow retry
    FAILED_VALIDATION: ['PROCESSING'],
    FAILED_AI: ['ENRICHED'], // allow retry from enrichment
    FAILED_INTERNAL: ['PROCESSING'],
};

export function assertValidTransition(from: InvoiceStatus, to: InvoiceStatus): void {
    const allowed = TRANSITIONS[from];
    if (!allowed.includes(to)) {
        throw new ValidationError(`Invalid invoice status transition: ${from} → ${to}`, {
            from,
            to,
            allowed,
        });
    }
}

export function isTerminalStatus(status: InvoiceStatus): boolean {
    return status === 'COMPLETED';
}

export function isFailureStatus(status: InvoiceStatus): boolean {
    return status.startsWith('FAILED_');
}

export function isProcessingStatus(status: InvoiceStatus): boolean {
    return ['UPLOADED', 'PROCESSING', 'EXTRACTED', 'ENRICHED', 'REVIEW_READY'].includes(status);
}
