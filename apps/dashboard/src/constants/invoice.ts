import type { InvoiceCategory, InvoiceStatus } from '@/api/invoices';

export const STATUS_CONFIG: Record<
    InvoiceStatus,
    { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
    UPLOADED: { label: 'Uploaded', variant: 'secondary' },
    PROCESSING: { label: 'Processing', variant: 'secondary' },
    EXTRACTED: { label: 'Extracted', variant: 'secondary' },
    ENRICHED: { label: 'Enriched', variant: 'secondary' },
    REVIEW_READY: { label: 'Review Ready', variant: 'outline' },
    COMPLETED: { label: 'Completed', variant: 'default' },
    FAILED_OCR: { label: 'OCR Failed', variant: 'destructive' },
    FAILED_VALIDATION: { label: 'Validation Failed', variant: 'destructive' },
    FAILED_AI: { label: 'AI Failed', variant: 'destructive' },
    FAILED_INTERNAL: { label: 'Internal Error', variant: 'destructive' },
} as const;

export const CATEGORY_LABELS: Record<InvoiceCategory, string> = {
    software: 'Software',
    hardware: 'Hardware',
    office: 'Office',
    travel: 'Travel',
    marketing: 'Marketing',
    utilities: 'Utilities',
    consulting: 'Consulting',
    other: 'Other',
} as const;

export const STATUS_OPTIONS: Array<InvoiceStatus> = [
    'COMPLETED',
    'REVIEW_READY',
    'PROCESSING',
    'UPLOADED',
    'FAILED_OCR',
    'FAILED_AI',
    'FAILED_VALIDATION',
    'FAILED_INTERNAL',
] as const;

export const CATEGORY_OPTIONS: Array<InvoiceCategory> = [
    'software',
    'hardware',
    'office',
    'travel',
    'marketing',
    'utilities',
    'consulting',
    'other',
] as const;
