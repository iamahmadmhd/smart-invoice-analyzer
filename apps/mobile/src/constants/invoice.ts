import { InvoiceStatus } from '@smart-invoice-analyzer/contracts';

export const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'UPLOADED', label: 'Uploaded' },
    { value: 'EXTRACTED', label: 'Extracted' },
    { value: 'ENRICHED', label: 'Enriched' },
    { value: 'REVIEW_READY', label: 'Review Ready' },
    { value: 'FAILED_OCR', label: 'Failed (OCR)' },
    { value: 'FAILED_AI', label: 'Failed (AI)' },
    { value: 'FAILED_VALIDATION', label: 'Failed (Validation)' },
    { value: 'FAILED_INTERNAL', label: 'Failed (Internal)' },
];

export const CATEGORY_OPTIONS = [
    'software',
    'hardware',
    'office',
    'travel',
    'marketing',
    'utilities',
    'consulting',
    'other',
] as const;

export type InvoiceCategory = (typeof CATEGORY_OPTIONS)[number];

export const TAX_RATE_OPTIONS: { label: string; value: number }[] = [
    { label: '0 %', value: 0 },
    { label: '7 %', value: 7 },
    { label: '19 %', value: 19 },
];
