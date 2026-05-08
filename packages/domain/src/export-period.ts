import { ExportPeriod } from '@smart-invoice-analyzer/contracts';
import { ValidationError } from '@smart-invoice-analyzer/observability';

export interface DateRange {
    periodStart: string; // YYYY-MM-DD
    periodEnd: string; // YYYY-MM-DD
}

export function resolvePeriod(period: ExportPeriod): DateRange {
    const { type, year } = period;

    if (type === 'year') {
        return {
            periodStart: `${year}-01-01`,
            periodEnd: `${year}-12-31`,
        };
    }

    if (type === 'quarter') {
        if (!period.quarter) throw new ValidationError('quarter is required for type=quarter');
        const startMonth = (period.quarter - 1) * 3 + 1;
        const endMonth = startMonth + 2;
        return {
            periodStart: `${year}-${String(startMonth).padStart(2, '0')}-01`,
            periodEnd: lastDayOf(year, endMonth),
        };
    }

    if (type === 'month') {
        if (!period.month) throw new ValidationError('month is required for type=month');
        return {
            periodStart: `${year}-${String(period.month).padStart(2, '0')}-01`,
            periodEnd: lastDayOf(year, period.month),
        };
    }

    throw new ValidationError(`Unknown period type: ${type}`);
}

function lastDayOf(year: number, month: number): string {
    const date = new Date(year, month, 0);
    return `${year}-${String(month).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
