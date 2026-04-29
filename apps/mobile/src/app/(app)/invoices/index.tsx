import React, { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Invoice } from '@smart-invoice-analyzer/contracts';
import { useInvoices } from '@/hooks/use-invoices';
import { InvoiceFilters } from '@/store/slices/invoices-slice';
import { Text } from '@/components/atoms/text';
import { Icon } from '@/components/atoms/icon';
import { ScreenContainer } from '@/components/atoms/screen-container';
import { SearchBar } from '@/components/molecules/search-bar';
import { FilterChipGroup, ActiveFilter } from '@/components/molecules/filter-chip-group';
import { InvoiceList } from '@/components/organisms/invoice-list';
import { FilterSheet, STATUS_OPTIONS } from '@/components/organisms/filter-sheet';

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
    const { top } = useSafeAreaInsets();
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);

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

    return (
        <ScreenContainer className='flex-1'>
            <View
                className='py-4'
                style={{ paddingTop: top + 16 }}
            >
                {/* Header */}
                <View className='gap-3 px-4 pb-2'>
                    <View className='flex-row items-center justify-between'>
                        <Text
                            variant='heading2'
                            color='primary'
                        >
                            Invoices
                        </Text>
                        <Pressable
                            onPress={handleUploadPress}
                            className='h-9 w-9 items-center justify-center rounded-xl bg-brand active:opacity-80'
                            accessibilityLabel='Upload invoice'
                        >
                            <Icon
                                name='plus'
                                size={18}
                                tintColor='#fff'
                            />
                        </Pressable>
                    </View>
                    <SearchBar
                        value={searchQuery}
                        onChangeText={updateSearch}
                        onClear={() => updateSearch('')}
                    />
                </View>

                {/* Filters */}
                <FilterChipGroup
                    activeFilters={activeFilters}
                    onRemoveFilter={removeFilter}
                    onOpenFilterSheet={() => setFilterSheetOpen(true)}
                />
            </View>

            {/* List */}
            <InvoiceList
                invoices={invoices}
                loading={loading}
                loadingMore={loadingMore}
                hasMore={hasMore}
                onRefresh={refresh}
                onLoadMore={loadMore}
                onPressInvoice={handlePressInvoice}
                onUploadPress={handleUploadPress}
            />

            {/* Filter sheet */}
            <FilterSheet
                visible={filterSheetOpen}
                currentFilters={filters}
                onApply={applyFilters}
                onClose={() => setFilterSheetOpen(false)}
            />
        </ScreenContainer>
    );
}
