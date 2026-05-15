import { ExportPeriod } from '@smart-invoice-analyzer/contracts';
import { ValidationError } from '@smart-invoice-analyzer/errors';
import {
    endOfMonth,
    endOfQuarter,
    endOfYear,
    format,
    startOfMonth,
    startOfQuarter,
    startOfYear,
} from 'date-fns';

export interface DateRange {
    periodStart: string; // YYYY-MM-DD
    periodEnd: string; // YYYY-MM-DD
}

const ISO_DATE = 'yyyy-MM-dd';

export function resolvePeriod(period: ExportPeriod): DateRange {
    const { type, year } = period;

    if (type === 'year') {
        const base = new Date(year, 0, 1);
        return {
            periodStart: format(startOfYear(base), ISO_DATE),
            periodEnd: format(endOfYear(base), ISO_DATE),
        };
    }

    if (type === 'quarter') {
        if (!period.quarter) throw new ValidationError('quarter is required for type: quarter');
        // Set month to first month of the quarter (0-indexed: Q1→0, Q2→3, Q3→6, Q4→9)
        const firstMonthOfQuarter = (period.quarter - 1) * 3;
        const base = new Date(year, firstMonthOfQuarter, 1);
        return {
            periodStart: format(startOfQuarter(base), ISO_DATE),
            periodEnd: format(endOfQuarter(base), ISO_DATE),
        };
    }

    if (type === 'month') {
        if (!period.month) throw new ValidationError('month is required for type: month');
        const base = new Date(year, period.month - 1, 1);
        return {
            periodStart: format(startOfMonth(base), ISO_DATE),
            periodEnd: format(endOfMonth(base), ISO_DATE),
        };
    }

    throw new ValidationError(`Unknown period type: ${type}`);
}
