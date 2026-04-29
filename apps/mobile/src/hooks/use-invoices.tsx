import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
    clearFilters,
    fetchInvoices,
    fetchMoreInvoices,
    InvoiceFilters,
    setFilters,
    setSearchQuery,
} from '@/store/slices/invoices-slice';

export function useInvoices() {
    const dispatch = useAppDispatch();
    const { items, status, hasMore, nextToken, filters, searchQuery, error } = useAppSelector(
        (s) => s.invoices
    );

    useEffect(() => {
        if (status === 'idle') dispatch(fetchInvoices(filters));
    }, [dispatch, status, filters]);

    const refresh = useCallback(() => {
        dispatch(fetchInvoices(filters));
    }, [dispatch, filters]);

    const loadMore = useCallback(() => {
        if (hasMore && nextToken && status === 'succeeded') {
            dispatch(fetchMoreInvoices({ filters, nextToken }));
        }
    }, [dispatch, filters, hasMore, nextToken, status]);

    const applyFilters = useCallback(
        (newFilters: InvoiceFilters) => {
            dispatch(setFilters(newFilters));
        },
        [dispatch]
    );

    const updateSearch = useCallback(
        (q: string) => {
            dispatch(setSearchQuery(q));
        },
        [dispatch]
    );

    const reset = useCallback(() => {
        dispatch(clearFilters());
    }, [dispatch]);

    // Client-side search filter on top of server results
    const filteredItems = searchQuery
        ? items.filter(
              (inv) =>
                  inv.vendorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : items;

    return {
        invoices: filteredItems,
        loading: status === 'loading',
        loadingMore: status === 'loadingMore',
        hasMore,
        filters,
        searchQuery,
        error,
        refresh,
        loadMore,
        applyFilters,
        updateSearch,
        reset,
    };
}
