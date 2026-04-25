export function formatGermanDate(isoDate: string): string {
    // YYYY-MM-DD → DDMM (DATEV Belegdatum format)
    const [, month, day] = isoDate.split('-');
    return `${day}${month}`;
}

export function formatGermanAmount(amount: number): string {
    // DATEV expects German decimal format: comma as decimal separator
    return amount.toFixed(2).replace('.', ',');
}

export function vatRateToBUSchluessel(taxRate: number | undefined): string {
    switch (taxRate) {
        case 19:
            return '9';
        case 7:
            return '8';
        case 0:
            return '';
        default:
            return '';
    }
}
