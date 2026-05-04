import { EmptyState } from '@/components';
import { Container } from '@/components/atoms/screen-container';
import { ActiveFilter, FilterChipGroup } from '@/components/molecules/filter-chip-group';
import { SearchBar } from '@/components/molecules/search-bar';
import { FilterSheet, STATUS_OPTIONS } from '@/components/organisms/filter-sheet';
import { InvoiceList } from '@/components/organisms/invoice-list';
import { useInvoices } from '@/hooks/use-invoices';
import { InvoiceFilters } from '@/store/slices/invoices-slice';
import { Invoice } from '@smart-invoice-analyzer/contracts';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useColorScheme, View } from 'react-native';

function buildActiveFilters(filters: InvoiceFilters): ActiveFilter[] {
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

export default function InvoicesScreen() {
    const router = useRouter();
    const scheme = useColorScheme();
    const [filterSheetIsVisible, setFilterSheetIsVisible] = useState(false);

    const {
        invoices,
        loading,
        loadingMore,
        hasMore,
        filters,
        searchQuery,
        refresh,
        loadMore,
        applyFilters,
        updateSearch,
    } = useInvoices();

    const activeFilters = buildActiveFilters(filters);

    const removeFilter = useCallback(
        (key: string) => {
            applyFilters({ ...filters, [key]: undefined });
        },
        [filters, applyFilters]
    );

    const handlePressInvoice = useCallback(
        (invoice: Invoice) => {
            router.push(`/(app)/invoices/${invoice.invoiceId}`);
        },
        [router]
    );

    const handleUploadPress = useCallback(() => {
        router.push('/(app)/invoices/upload');
    }, [router]);

    if (!loading && invoices.length === 0) {
        return (
            <View className='flex-1'>
                <Container className='flex-none gap-3 pt-4 pb-2'>
                    <SearchBar
                        value={searchQuery}
                        onChangeText={updateSearch}
                        onClear={() => updateSearch('')}
                    />
                    <FilterChipGroup
                        activeFilters={activeFilters}
                        onRemoveFilter={removeFilter}
                        onOpenFilterSheet={() => setFilterSheetIsVisible(true)}
                    />
                </Container>
                <Container>
                    <EmptyState
                        icon='invoice'
                        title='No invoices found'
                        body='Upload your first invoice to get started'
                        action={{ label: 'Upload Invoice', onPress: handleUploadPress }}
                    />
                </Container>
            </View>
        );
    }

    return (
        <View className='flex-1'>
            <Container className='flex-none gap-3 pt-4 pb-2'>
                <SearchBar
                    value={searchQuery}
                    onChangeText={updateSearch}
                    onClear={() => updateSearch('')}
                />
                <FilterChipGroup
                    activeFilters={activeFilters}
                    onRemoveFilter={removeFilter}
                    onOpenFilterSheet={() => setFilterSheetIsVisible(true)}
                />
            </Container>

            <Container>
                <InvoiceList
                    invoices={invoices}
                    loading={loading}
                    loadingMore={loadingMore}
                    hasMore={hasMore}
                    onRefresh={refresh}
                    onLoadMore={loadMore}
                    onPressInvoice={handlePressInvoice}
                />
            </Container>

            {filterSheetIsVisible && (
                <BlurView
                    intensity={50}
                    tint={scheme === 'dark' ? 'dark' : 'light'}
                    className='absolute inset-0 z-0'
                />
            )}
            <FilterSheet
                isVisible={filterSheetIsVisible}
                currentFilters={filters}
                onApply={applyFilters}
                onClose={() => setFilterSheetIsVisible(false)}
            />
        </View>
    );
}
