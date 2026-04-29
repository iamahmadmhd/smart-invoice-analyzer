import { Invoice } from '@smart-invoice-analyzer/contracts';
import { cn } from '@/lib/utils';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Badge, InvoiceStatusBadge } from '../atoms/badge';
import { Icon } from '../atoms/icon';
import { Text } from '../atoms/text';

function formatAmount(amount: number | undefined, currency = 'EUR'): string {
    if (amount === undefined) return '—';
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

function formatDate(iso: string | undefined): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(iso));
}

function mapStatus(
    status: Invoice['status']
): 'pending' | 'processing' | 'completed' | 'failed' | 'duplicate' | 'anomaly' {
    if (status === 'COMPLETED') return 'completed';
    if (status.startsWith('FAILED')) return 'failed';
    if (['UPLOADED', 'PROCESSING', 'EXTRACTED', 'ENRICHED', 'REVIEW_READY'].includes(status))
        return 'processing';
    return 'pending';
}

export interface InvoiceCardProps {
    invoice: Invoice;
    onPress?: () => void;
    className?: string;
}

export function InvoiceCard({ invoice, onPress, className }: InvoiceCardProps) {
    const hasDuplicate = invoice.duplicateFlag;
    const hasAnomaly = invoice.anomalyFlag;

    return (
        <Pressable
            onPress={onPress}
            className={cn(
                'gap-3 rounded-xl border border-wire bg-canvas p-4 active:opacity-80 dark:border-wire-night dark:bg-night-subtle',
                className
            )}
            accessibilityRole='button'
            accessibilityLabel={`Invoice from ${invoice.vendorName ?? 'unknown vendor'}`}
        >
            {/* Top row */}
            <View className='flex-row items-start justify-between gap-2'>
                <View className='flex-1 gap-1'>
                    <Text
                        variant='body-semibold'
                        color='primary'
                        numberOfLines={1}
                    >
                        {invoice.vendorName ?? 'Unknown Vendor'}
                    </Text>
                    {invoice.invoiceNumber && (
                        <Text
                            variant='caption'
                            color='tertiary'
                        >
                            #{invoice.invoiceNumber}
                        </Text>
                    )}
                </View>
                <InvoiceStatusBadge
                    status={mapStatus(invoice.status)}
                    size='sm'
                />
            </View>

            {/* Bottom row */}
            <View className='flex-row items-center justify-between'>
                <View className='flex-row items-center gap-3'>
                    <Text
                        variant='caption'
                        color='tertiary'
                    >
                        {formatDate(invoice.invoiceDate)}
                    </Text>
                    {hasDuplicate && (
                        <Badge
                            label='Duplicate'
                            variant='warning'
                            size='sm'
                        />
                    )}
                    {hasAnomaly && (
                        <Badge
                            label='Anomaly'
                            variant='error'
                            size='sm'
                        />
                    )}
                </View>
                <Text
                    variant='body-semibold'
                    color='primary'
                >
                    {formatAmount(invoice.totalAmount, invoice.currency)}
                </Text>
            </View>

            {/* Confidence bar */}
            {invoice.confidenceScore !== undefined && invoice.confidenceScore < 0.75 && (
                <View className='flex-row items-center gap-2'>
                    <Icon
                        name='warning'
                        size={12}
                        color='warning'
                    />
                    <Text
                        variant='caption'
                        color='warning'
                    >
                        Low confidence ({Math.round(invoice.confidenceScore * 100)}%)
                    </Text>
                </View>
            )}
        </Pressable>
    );
}
