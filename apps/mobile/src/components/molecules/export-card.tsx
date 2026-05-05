import { formatDate } from '@/lib/formatters';
import { ExportBatch, ExportBatchStatus } from '@smart-invoice-analyzer/contracts';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Badge, BadgeVariant } from '../atoms/badge';
import { Icon } from '../atoms/icon';
import { Text } from '../atoms/text';

export interface ExportCardProps {
    batch: ExportBatch;
    onPress: () => void;
}

// Export batch status badge

const STATUS_MAP: Record<
    ExportBatchStatus,
    { label: string; variant: BadgeVariant; dot?: boolean }
> = {
    PENDING: { label: 'Pending', variant: 'neutral', dot: false },
    VALIDATING: { label: 'Validating', variant: 'processing', dot: true },
    READY: { label: 'Ready', variant: 'brand', dot: false },
    GENERATING: { label: 'Generating', variant: 'processing', dot: true },
    COMPLETED: { label: 'Completed', variant: 'success', dot: false },
    FAILED: { label: 'Failed', variant: 'error', dot: false },
};

function ExportStatusBadge({
    status,
    size = 'md',
}: {
    status: ExportBatchStatus;
    size?: 'sm' | 'md';
}) {
    const { label, variant, dot } = STATUS_MAP[status] ?? STATUS_MAP.PENDING;
    return (
        <Badge
            label={label}
            variant={variant}
            dot={dot}
            size={size}
        />
    );
}

export function ExportCard({ batch, onPress }: ExportCardProps) {
    const period = `${batch.periodStart} – ${batch.periodEnd}`;

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
                            DATEV Export
                        </Text>
                        <Text
                            variant='caption'
                            color='secondary'
                        >
                            {period}
                        </Text>
                    </View>
                    <ExportStatusBadge
                        status={batch.status}
                        size='sm'
                    />
                </View>

                <View className='flex-row items-center justify-between'>
                    <Text
                        variant='caption'
                        color='tertiary'
                    >
                        {batch.sachkontenrahmen} · Berater {batch.beraternummer}
                    </Text>
                    <View className='flex-row items-center gap-1'>
                        <Text
                            variant='caption'
                            color='tertiary'
                        >
                            {formatDate(batch.createdAt)}
                        </Text>
                        <Icon
                            name='forward'
                            size={14}
                            color='tertiary'
                        />
                    </View>
                </View>
            </View>
        </Pressable>
    );
}
