/**
 * Format ISO date string (YYYY-MM-DD) to German format (DD.MM.YYYY)
 */
export function formatGermanDate(isoDate: string | undefined): string {
    if (!isoDate) return '—';
    const [year, month, day] = isoDate.split('-');
    if (!year || !month || !day) return isoDate;
    return `${day}.${month}.${year}`;
}

/**
 * Format a number as German currency (e.g. 1.234,56 EUR)
 */
export function formatCurrency(amount: number | undefined, currency = 'EUR'): string {
    if (amount === undefined) return '—';
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format a percentage (e.g. 19 → "19 %")
 */
export function formatPercent(rate: number | undefined): string {
    if (rate === undefined) return '—';
    return `${rate} %`;
}

/**
 * Format a confidence score (0–1) as a percentage string
 */
export function formatConfidence(score: number | undefined): string {
    if (score === undefined) return '—';
    return `${Math.round(score * 100)} %`;
}

/**
 * Return relative label for a date ("Heute", "Gestern", or DD.MM.YYYY)
 */
export function formatRelativeDate(isoDate: string | undefined): string {
    if (!isoDate) return '—';
    const date = new Date(isoDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Heute';
    if (date.toDateString() === yesterday.toDateString()) return 'Gestern';
    return formatGermanDate(isoDate);
}

/**
 * Format an ISO timestamp to localised German date + time
 */
export function formatDateTime(isoString: string | undefined): string {
    if (!isoString) return '—';
    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(isoString));
}
