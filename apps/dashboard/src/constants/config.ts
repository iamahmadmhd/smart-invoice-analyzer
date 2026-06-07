import type { AllowedContentType } from '@/api/invoices';

export const CONFIG = {
    staleTime: 30_000,
    locale: 'de-DE',
    currency: 'EUR',
    acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'] as Array<AllowedContentType>,
    acceptedExtensions: '.pdf,.jpg,.jpeg,.png',
} as const;
