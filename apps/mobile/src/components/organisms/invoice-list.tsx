import React, { useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { Invoice } from '@smart-invoice-analyzer/contracts';
import { InvoiceCard } from '../molecules/invoice-card';
import { EmptyState } from '../molecules/empty-state';
import { InvoiceCardSkeleton } from '../atoms/skeleton';
import { Spinner } from '../atoms/spinner';

export interface InvoiceListProps {
    invoices: Invoice[];
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    onRefresh: () => void;
    onLoadMore: () => void;
    onPressInvoice: (invoice: Invoice) => void;
    onUploadPress?: () => void;
}

const SKELETON_COUNT = 5;

export function InvoiceList({
    invoices,
    loading,
    loadingMore,
    hasMore,
    onRefresh,
    onLoadMore,
    onPressInvoice,
    onUploadPress,
}: InvoiceListProps) {
    const renderItem = useCallback(
        ({ item }: { item: Invoice }) => (
            <InvoiceCard
                invoice={item}
                onPress={() => onPressInvoice(item)}
                className='mx-4'
            />
        ),
        [onPressInvoice]
    );

    const keyExtractor = useCallback((item: Invoice) => item.invoiceId, []);

    if (loading) {
        return (
            <View className='gap-3 px-4'>
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                    <InvoiceCardSkeleton key={i} />
                ))}
            </View>
        );
    }

    return (
        <FlatList
            data={invoices}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerClassName='gap-3 pb-8'
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={false}
                    onRefresh={onRefresh}
                    tintColor='#5469d4'
                />
            }
            onEndReached={() => {
                if (hasMore && !loadingMore) onLoadMore();
            }}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={
                <EmptyState
                    icon='invoice'
                    title='No invoices yet'
                    body='Upload your first invoice to get started.'
                    action={
                        onUploadPress
                            ? { label: 'Upload Invoice', onPress: onUploadPress }
                            : undefined
                    }
                />
            }
            ListFooterComponent={
                loadingMore ? (
                    <View className='items-center py-4'>
                        <Spinner size='sm' />
                    </View>
                ) : null
            }
        />
    );
}
