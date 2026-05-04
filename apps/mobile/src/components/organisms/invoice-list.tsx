import { Invoice } from '@smart-invoice-analyzer/contracts';
import React from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
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

export function InvoiceList({
    invoices,
    loading,
    loadingMore,
    hasMore,
    onRefresh,
    onLoadMore,
    onPressInvoice,
}: InvoiceListProps) {
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
            contentContainerClassName='gap-3 pb-6'
            refreshControl={
                onRefresh ? (
                    <RefreshControl
                        refreshing={loading}
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
