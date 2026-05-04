export function formatAmount(amount: number | undefined, currency = 'EUR'): string {
    if (amount === undefined) return '—';
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

export function formatDate(iso: string | undefined): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date(iso));
}

export function formatDateShort(iso: string | undefined): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(iso));
}

export function formatTaxRate(rate: number | undefined): string {
    if (rate === undefined) return '—';
    return `${rate} %`;
}
