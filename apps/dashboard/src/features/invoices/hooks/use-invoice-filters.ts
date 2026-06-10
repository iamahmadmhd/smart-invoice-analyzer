import { useNavigate, useSearch } from '@tanstack/react-router';
import type { InvoiceCategoryFilter, InvoiceStatusFilter } from '@/api/invoices';

export function useInvoiceFilters() {
    const search = useSearch({ from: '/(app)/$teamId/invoices/' });
    const navigate = useNavigate({ from: '/$teamId/invoices/' });

    const filters = {
        vendorName: search.vendorName,
        status: search.status,
        category: search.category,
        duplicateFlag: search.duplicateFlag,
        anomalyFlag: search.anomalyFlag,
    };

    const setFilters = (newFilters: Partial<typeof filters>) => {
        navigate({
            search: (prev: any) => {
                const next = { ...prev, ...newFilters };
                // Clean up empty, false, or undefined keys
                Object.keys(next).forEach((key) => {
                    if (next[key] === undefined || next[key] === false || next[key] === '') {
                        delete next[key];
                    }
                });
                return next;
            },
            replace: true,
        });
    };

    const setters = {
        setVendorName: (vendorName?: string) => setFilters({ vendorName }),
        setStatus: (status?: InvoiceStatusFilter) => setFilters({ status }),
        setCategory: (category?: InvoiceCategoryFilter) => setFilters({ category }),
        setDuplicateFlag: (duplicateFlag?: boolean) =>
            setFilters({ duplicateFlag: duplicateFlag ? true : undefined }),
        setAnomalyFlag: (anomalyFlag?: boolean) =>
            setFilters({ anomalyFlag: anomalyFlag ? true : undefined }),
    };

    const activeCount =
        (filters.status ? 1 : 0) +
        (filters.category ? 1 : 0) +
        (filters.duplicateFlag ? 1 : 0) +
        (filters.anomalyFlag ? 1 : 0);

    const clear = () => {
        navigate({
            search: (prev: any) => {
                const next = { ...prev };
                delete next.vendorName;
                delete next.status;
                delete next.category;
                delete next.duplicateFlag;
                delete next.anomalyFlag;
                return next;
            },
            replace: true,
        });
    };

    return {
        filters,
        setters,
        activeCount,
        clear,
    };
}
