import { Invoice } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Badge } from './badge';
import { Icon } from './icon';
import { Text } from './text';

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    const [year, month, day] = iso.split('-');
    return `${day}.${month}.${year}`;
}

function statusConfig(status: string): {
    label: string;
    variant: 'default' | 'brand' | 'success' | 'warning' | 'error' | 'processing' | 'neutral';
    dot: boolean;
} {
    switch (status) {
        case 'UPLOADED':
            return { label: 'Uploaded', variant: 'neutral', dot: false };
        case 'PROCESSING':
        case 'EXTRACTED':
        case 'ENRICHED':
        case 'REVIEW_READY':
            return { label: 'Processing', variant: 'processing', dot: true };
        case 'COMPLETED':
            return { label: 'Complete', variant: 'success', dot: false };
        case 'FAILED_OCR':
        case 'FAILED_VALIDATION':
        case 'FAILED_AI':
        case 'FAILED_INTERNAL':
            return { label: 'Failed', variant: 'error', dot: false };
        default:
            return { label: status, variant: 'neutral', dot: false };
    }
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface InvoiceCardProps {
    invoice: Invoice;
    onPress?: () => void;
    className?: string;
}

export function InvoiceCard({ invoice, onPress, className }: InvoiceCardProps) {
    const { label, variant, dot } = statusConfig(invoice.status);
    const hasFlags = invoice.duplicateFlag || invoice.anomalyFlag;

    return (
        <Pressable
            onPress={onPress}
            className={cn(
                'rounded-xl border border-wire dark:border-wire-night',
                'bg-canvas dark:bg-night-inset',
                'p-4 active:opacity-70',
                className
            )}
            accessibilityRole='button'
        >
            {/* Top row: vendor + amount */}
            <View className='flex-row items-start justify-between gap-3'>
                <View className='flex-1 gap-0.5'>
                    <Text
                        variant='body-semibold'
                        color='primary'
                        numberOfLines={1}
                    >
                        {invoice.vendorName ?? 'Unknown vendor'}
                    </Text>
                    {invoice.invoiceNumber && (
                        <Text
                            variant='caption'
                            color='tertiary'
                            numberOfLines={1}
                        >
                            #{invoice.invoiceNumber}
                        </Text>
                    )}
                </View>

                <View className='items-end gap-1'>
                    <Text
                        variant='body-semibold'
                        color='primary'
                    >
                        {formatAmount(invoice.totalAmount, invoice.currency)}
                    </Text>
                    {invoice.taxRate !== undefined && (
                        <Text
                            variant='caption'
                            color='tertiary'
                        >
                            {invoice.taxRate}% VAT
                        </Text>
                    )}
                </View>
            </View>

            {/* Bottom row: date, category, status, flags */}
            <View className='mt-3 flex-row flex-wrap items-center gap-2'>
                {invoice.invoiceDate && (
                    <View className='flex-row items-center gap-1'>
                        <Icon
                            name='calendar'
                            size={12}
                            color='tertiary'
                        />
                        <Text
                            variant='caption'
                            color='tertiary'
                        >
                            {formatDate(invoice.invoiceDate)}
                        </Text>
                    </View>
                )}

                {invoice.category && (
                    <View className='flex-row items-center gap-1'>
                        <Icon
                            name='tag'
                            size={12}
                            color='tertiary'
                        />
                        <Text
                            variant='caption'
                            color='tertiary'
                        >
                            {invoice.category}
                        </Text>
                    </View>
                )}

                <View className='flex-1' />

                {/* Flags */}
                {invoice.duplicateFlag && (
                    <Badge
                        label='Duplicate'
                        variant='warning'
                        size='sm'
                    />
                )}
                {invoice.anomalyFlag && (
                    <Badge
                        label='Anomaly'
                        variant='error'
                        size='sm'
                    />
                )}

                <Badge
                    label={label}
                    variant={variant}
                    dot={dot}
                    size='sm'
                />
            </View>

            {/* Confidence bar for completed invoices */}
            {invoice.status === 'COMPLETED' && invoice.confidenceScore !== undefined && (
                <View className='mt-3'>
                    <View className='h-1 w-full overflow-hidden rounded-full bg-canvas-inset dark:bg-night-raised'>
                        <View
                            className='h-full rounded-full bg-brand'
                            style={{ width: `${Math.round(invoice.confidenceScore * 100)}%` }}
                        />
                    </View>
                    <Text
                        variant='caption'
                        color='tertiary'
                        className='mt-0.5'
                    >
                        {Math.round(invoice.confidenceScore * 100)}% confidence
                    </Text>
                </View>
            )}
        </Pressable>
    );
}
