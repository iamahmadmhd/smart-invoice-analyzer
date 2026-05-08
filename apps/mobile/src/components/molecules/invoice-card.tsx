import { formatAmount, formatDateShort } from '@/lib/formatters';
import { mapInvoiceStatus } from '@/lib/invoice-utils';
import { Invoice } from '@smart-invoice-analyzer/contracts';
import React from 'react';
import { Pressable, View } from 'react-native';
import { InvoiceStatusBadge } from '../atoms/badge';
import { Text } from '../atoms/text';

export interface InvoiceCardProps {
    invoice: Invoice;
    onPress: () => void;
}

export function InvoiceCard({ invoice, onPress }: InvoiceCardProps) {
    return (
        <Pressable
            onPress={onPress}
            className='rounded-xl border border-wire bg-canvas p-4 active:bg-canvas-inset dark:border-wire-night dark:bg-night-subtle dark:active:bg-night-inset'
        >
            <View className='gap-3'>
                <View className='flex-row items-start justify-between gap-3'>
                    <View className='flex-1 gap-1'>
                        <Text
                            variant='body-semibold'
                            color='primary'
                            numberOfLines={1}
                        >
                            {invoice.vendorName || 'Unknown Vendor'}
                        </Text>
                        <Text
                            variant='caption'
                            color='secondary'
                        >
                            {formatDateShort(invoice.invoiceDate)}
                        </Text>
                    </View>
                    <InvoiceStatusBadge
                        status={mapInvoiceStatus(invoice.status)}
                        size='sm'
                    />
                </View>

                <View className='flex-row items-center justify-between'>
                    <Text
                        variant='caption'
                        color='tertiary'
                    >
                        {invoice.invoiceNumber || '—'}
                    </Text>
                    <Text
                        variant='body-semibold'
                        color='primary'
                    >
                        {formatAmount(invoice.totalAmount)}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}
