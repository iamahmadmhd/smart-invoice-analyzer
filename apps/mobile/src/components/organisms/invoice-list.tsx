import { Invoice } from '@smart-invoice-analyzer/contracts';
import React from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { InvoiceCardSkeleton } from '../atoms/skeleton';
import { Spinner } from '../atoms/spinner';
import { InvoiceCard } from '../molecules/invoice-card';

export interface InvoiceListProps {
    invoices: Invoice[];
    loading: boolean;
    loadingMore?: boolean;
    hasMore?: boolean;
    onRefresh?: () => void;
    onLoadMore?: () => void;
    onPressInvoice: (invoice: Invoice) => void;
}

const SKELETON_COUNT = 6;

export function InvoiceList({
    invoices,
    loading,
    loadingMore,
    hasMore,
    onRefresh,
    onLoadMore,
    onPressInvoice,
}: InvoiceListProps) {
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
            keyExtractor={(item) => item.invoiceId}
            renderItem={({ item }) => (
                <InvoiceCard
                    invoice={item}
                    onPress={() => onPressInvoice(item)}
                />
            )}
            contentContainerClassName='gap-3 px-4 pb-6'
            refreshControl={
                onRefresh ? (
                    <RefreshControl
                        refreshing={false}
                        onRefresh={onRefresh}
                    />
                ) : undefined
            }
            onEndReached={hasMore ? onLoadMore : undefined}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
                loadingMore ? (
                    <View className='items-center py-4'>
                        <Spinner />
                    </View>
                ) : null
            }
        />
    );
}
