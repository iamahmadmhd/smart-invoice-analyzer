import { ActiveFilter } from '@/components/molecules/filter-chip-group';
import { STATUS_OPTIONS } from '@/constants/invoice';
import { InvoiceFilters } from '@/store/slices/invoices-slice';

export function buildActiveFilters(filters: InvoiceFilters): ActiveFilter[] {
    const result: ActiveFilter[] = [];
    if (filters.status)
        result.push({
            key: 'status',
            label: STATUS_OPTIONS.find((o) => o.value === filters.status)?.label ?? filters.status,
        });
    if (filters.category)
        result.push({
            key: 'category',
            label: filters.category.charAt(0).toUpperCase() + filters.category.slice(1),
        });
    if (filters.duplicateFlag) result.push({ key: 'duplicateFlag', label: 'Duplicates' });
    if (filters.anomalyFlag) result.push({ key: 'anomalyFlag', label: 'Anomalies' });
    return result;
}
