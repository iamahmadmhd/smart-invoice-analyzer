export const formatters = {
    amount: (amount?: number, currency = 'EUR') =>
        amount !== undefined
            ? new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount)
            : '—',

    date: (date?: string) => (date ? new Intl.DateTimeFormat('de-DE').format(new Date(date)) : '—'),
};
