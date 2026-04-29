import React from 'react';
import { ScrollView, View } from 'react-native';
import { Chip } from '../atoms/chip';
import { InvoiceStatus } from '@smart-invoice-analyzer/contracts';
import { cn } from '@/lib/utils';

export interface ActiveFilter {
    key: string;
    label: string;
}

export interface FilterChipGroupProps {
    activeFilters: ActiveFilter[];
    onRemoveFilter: (key: string) => void;
    onOpenFilterSheet?: () => void;
    className?: string;
    contentContainerClassName?: string;
}

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'UPLOADED', label: 'Uploaded' },
    { value: 'FAILED_OCR', label: 'Failed' },
];

export function FilterChipGroup({
    activeFilters,
    onRemoveFilter,
    onOpenFilterSheet,
    className,
    contentContainerClassName,
}: FilterChipGroupProps) {
    if (activeFilters.length === 0 && !onOpenFilterSheet) return null;

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, flexShrink: 0 }}
            className={cn(className)}
            contentContainerClassName={cn('px-4 gap-2 py-0.5', contentContainerClassName)}
        >
            {onOpenFilterSheet && (
                <Chip
                    label='Filters'
                    onPress={onOpenFilterSheet}
                    selected={activeFilters.length > 0}
                />
            )}
            {activeFilters.map((filter) => (
                <Chip
                    key={filter.key}
                    label={filter.label}
                    selected
                    onDismiss={() => onRemoveFilter(filter.key)}
                />
            ))}
        </ScrollView>
    );
}
