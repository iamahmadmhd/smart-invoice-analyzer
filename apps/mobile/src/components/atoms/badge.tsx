import React from 'react';
import { View } from 'react-native';
import { Text } from './text';

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant =
    | 'default'
    | 'brand'
    | 'success'
    | 'warning'
    | 'error'
    | 'processing'
    | 'neutral';

type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
    size?: BadgeSize;
    dot?: boolean;
    className?: string;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const variantContainer: Record<BadgeVariant, string> = {
    default: 'bg-canvas-inset     dark:bg-night-raised',
    brand: 'bg-brand-subtle     dark:bg-night-raised',
    success: 'bg-jade-subtle      dark:bg-jade-night-subtle',
    warning: 'bg-amber-subtle     dark:bg-amber-night-subtle',
    error: 'bg-crimson-subtle   dark:bg-crimson-night-subtle',
    processing: 'bg-azure-subtle     dark:bg-azure-night-subtle',
    neutral: 'bg-canvas-inset     dark:bg-night-inset',
};

const variantDot: Record<BadgeVariant, string> = {
    default: 'bg-ink-faint',
    brand: 'bg-brand',
    success: 'bg-jade',
    warning: 'bg-amber',
    error: 'bg-crimson',
    processing: 'bg-azure',
    neutral: 'bg-ink-faint     dark:bg-cloud-faint',
};

const variantLabel: Record<BadgeVariant, 'primary' | 'brand' | 'success' | 'warning' | 'error'> = {
    default: 'primary',
    brand: 'brand',
    success: 'success',
    warning: 'warning',
    error: 'error',
    processing: 'brand',
    neutral: 'primary',
};

const sizeContainer: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 rounded gap-1',
    md: 'px-2.5 py-1 rounded-md gap-1.5',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Badge({
    label,
    variant = 'default',
    size = 'md',
    dot = false,
    className = '',
}: BadgeProps) {
    const containerClasses = [
        'flex-row items-center self-start',
        variantContainer[variant],
        sizeContainer[size],
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

    return (
        <View className={containerClasses}>
            {dot && <View className={`${dotSize} rounded-full ${variantDot[variant]}`} />}
            <Text
                variant={size === 'sm' ? 'caption' : 'label'}
                color={variantLabel[variant]}
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
