import { cn } from '@/lib/utils';
import { cva, VariantProps } from 'class-variance-authority';
import React from 'react';
import { View } from 'react-native';
import { Text } from './text';

const badgeVariants = cva('flex-row items-center self-start', {
    variants: {
        variant: {
            default: 'bg-canvas-inset dark:bg-night-raised',
            brand: 'bg-brand-subtle dark:bg-night-raised',
            success: 'bg-jade-subtle dark:bg-jade-night-subtle',
            warning: 'bg-amber-subtle dark:bg-amber-night-subtle',
            error: 'bg-crimson-subtle dark:bg-crimson-night-subtle',
            processing: 'bg-azure-subtle dark:bg-azure-night-subtle',
            neutral: 'bg-canvas-inset dark:bg-night-inset',
        },
        size: {
            sm: 'px-2 py-0.5 rounded gap-1',
            md: 'px-2.5 py-1 rounded-md gap-1.5',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'md',
    },
});

const dotVariants = cva('rounded-full', {
    variants: {
        variant: {
            default: 'bg-ink-faint',
            brand: 'bg-brand',
            success: 'bg-jade',
            warning: 'bg-amber',
            error: 'bg-crimson',
            processing: 'bg-azure',
            neutral: 'bg-ink-faint dark:bg-cloud-faint',
        },
        size: {
            sm: 'w-1.5 h-1.5',
            md: 'w-2 h-2',
        },
    },
    defaultVariants: { variant: 'default', size: 'md' },
});

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;
type BadgeSize = NonNullable<VariantProps<typeof badgeVariants>['size']>;

const labelColors: Record<BadgeVariant, 'primary' | 'brand' | 'success' | 'warning' | 'error'> = {
    default: 'primary',
    brand: 'brand',
    success: 'success',
    warning: 'warning',
    error: 'error',
    processing: 'brand',
    neutral: 'primary',
};

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
    label: string;
    dot?: boolean;
    className?: string;
}

export function Badge({
    label,
    variant = 'default',
    size = 'md',
    dot = false,
    className,
}: BadgeProps) {
    return (
        <View className={cn(badgeVariants({ variant, size }), className)}>
            {dot && <View className={dotVariants({ variant, size })} />}
            <Text
                variant={size === 'sm' ? 'caption' : 'label'}
                color={labelColors[variant ?? 'default']}
            >
                {label}
            </Text>
        </View>
    );
}

// ─── Invoice-specific convenience badges ─────────────────────────────────────

type InvoiceStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'duplicate' | 'anomaly';

const invoiceStatusMap: Record<
    InvoiceStatus,
    { label: string; variant: BadgeVariant; dot: boolean }
> = {
    pending: { label: 'Pending', variant: 'neutral', dot: false },
    processing: { label: 'Processing', variant: 'processing', dot: true },
    completed: { label: 'Completed', variant: 'success', dot: false },
    failed: { label: 'Failed', variant: 'error', dot: false },
    duplicate: { label: 'Duplicate', variant: 'warning', dot: false },
    anomaly: { label: 'Anomaly', variant: 'error', dot: false },
};

export function InvoiceStatusBadge({
    status,
    size = 'md',
}: {
    status: InvoiceStatus;
    size?: BadgeSize;
}) {
    const { label, variant, dot } = invoiceStatusMap[status];
    return (
        <Badge
            label={label}
            variant={variant}
            dot={dot}
            size={size}
        />
    );
}
