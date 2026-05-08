import { EmptyState, Icon } from '@/components';
import { Container, ContainerScrollable } from '@/components/atoms/screen-container';
import { FilterChipGroup } from '@/components/molecules/filter-chip-group';
import { SearchBar } from '@/components/molecules/search-bar';
import { FilterSheet } from '@/components/organisms/filter-sheet';
import { InvoiceList } from '@/components/organisms/invoice-list';
import { useInvoices } from '@/hooks/use-invoices';
import { buildActiveFilters } from '@/lib/invoice-filters';
import { Invoice } from '@smart-invoice-analyzer/contracts';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Platform, Pressable, RefreshControl, useColorScheme, View } from 'react-native';

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
        (key: string) => applyFilters({ ...filters, [key]: undefined }),
        [filters, applyFilters]
    );

    const handlePressInvoice = useCallback(
        (invoice: Invoice) => router.push(`/(app)/invoices/${invoice.invoiceId}`),
        [router]
    );

    const handleUploadPress = useCallback(() => router.push('/(app)/invoices/upload'), [router]);

    const searchBar = (
        <SearchBar
            value={searchQuery}
            onChangeText={updateSearch}
            onClear={() => updateSearch('')}
        />
    );

    const filterChips = (
        <View className='flex-row items-center justify-between'>
            <FilterChipGroup
                activeFilters={activeFilters}
                onRemoveFilter={removeFilter}
                onOpenFilterSheet={() => setFilterSheetIsVisible(true)}
            />
            {Platform.OS === 'web' ? (
                <Pressable onPress={refresh}>
                    <Icon name='refresh' />
                </Pressable>
            ) : null}
        </View>
    );

    const filterSheet = (
        <FilterSheet
            isVisible={filterSheetIsVisible}
            currentFilters={filters}
            onApply={applyFilters}
            onClose={() => setFilterSheetIsVisible(false)}
        />
    );

    if (!loading && invoices.length === 0) {
        return (
            <View className='flex-1'>
                <Container className='flex-none gap-3 pt-4 pb-2'>
                    {searchBar}
                    {filterChips}
                </Container>
                <ContainerScrollable
                    contentContainerClassName='grow'
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={refresh}
                        />
                    }
                >
                    <EmptyState
                        icon='invoice'
                        title='No invoices found'
                        body='Upload your first invoice to get started'
                        action={{ label: 'Upload Invoice', onPress: handleUploadPress }}
                    />
                </ContainerScrollable>
                {filterSheet}
            </View>
        );
    }

    return (
        <View className='flex-1'>
            <Container className='flex-none gap-3 pt-4 pb-2'>
                {searchBar}
                {filterChips}
            </Container>

            <Container className='px-0'>
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
            {filterSheet}
        </View>
    );
}
