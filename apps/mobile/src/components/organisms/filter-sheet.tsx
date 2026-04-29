import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { InvoiceStatus } from '@smart-invoice-analyzer/contracts';
import { InvoiceFilters } from '@/store/slices/invoices-slice';
import { Button } from '../atoms/button';
import { Chip } from '../atoms/chip';
import { Divider } from '../atoms/spinner';
import { Text } from '../atoms/text';
import { Icon } from '../atoms/icon';

export const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'UPLOADED', label: 'Uploaded' },
    { value: 'FAILED_OCR', label: 'Failed (OCR)' },
    { value: 'FAILED_AI', label: 'Failed (AI)' },
];

const CATEGORY_OPTIONS = [
    'software',
    'hardware',
    'office',
    'travel',
    'marketing',
    'utilities',
    'consulting',
    'other',
];

export interface FilterSheetProps {
    visible: boolean;
    currentFilters: InvoiceFilters;
    onApply: (filters: InvoiceFilters) => void;
    onClose: () => void;
}

export function FilterSheet({ visible, currentFilters, onApply, onClose }: FilterSheetProps) {
    // ── Fix #2: sync draft whenever the sheet opens ───────────────────────────
    const [draft, setDraft] = useState<InvoiceFilters>(currentFilters);
    useEffect(() => {
        if (visible) setDraft(currentFilters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]); // intentionally omit currentFilters — only sync on open

    function toggle<K extends keyof InvoiceFilters>(key: K, value: InvoiceFilters[K]) {
        setDraft((prev) => ({ ...prev, [key]: prev[key] === value ? undefined : value }));
    }

    const handleApply = () => {
        onApply(draft);
        onClose();
    };

    const activeCount = Object.values(draft).filter((v) => v !== undefined).length;

    return (
        <React.Fragment>
            {visible && <View className='absolute inset-0 bg-black/50' />}
            <Modal
                visible={visible}
                transparent
                animationType='slide'
                onRequestClose={onClose}
            >
                <Pressable
                    className='flex-1'
                    onPress={onClose}
                />
                <View className='rounded-t-3xl bg-canvas pb-8 dark:bg-night-subtle'>
                    {/* Handle */}
                    <View className='items-center pt-3 pb-2'>
                        <View className='h-1 w-10 rounded-full bg-wire-strong dark:bg-wire-night' />
                    </View>

                    {/* Header */}
                    <View className='flex-row items-center justify-between px-4 pb-4'>
                        <Text
                            variant='heading4'
                            color='primary'
                        >
                            Filters
                        </Text>
                        <Pressable
                            onPress={onClose}
                            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                        >
                            <Icon
                                name='close'
                                size={20}
                                color='secondary'
                            />
                        </Pressable>
                    </View>
                    <Divider />

                    <ScrollView
                        className='max-h-96'
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Status */}
                        <View className='gap-3 px-4 pt-4'>
                            <Text
                                variant='label'
                                color='secondary'
                            >
                                Status
                            </Text>
                            <View className='flex-row flex-wrap gap-2'>
                                {STATUS_OPTIONS.map((opt) => (
                                    <Chip
                                        key={opt.value}
                                        label={opt.label}
                                        selected={draft.status === opt.value}
                                        onPress={() => toggle('status', opt.value)}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Category */}
                        <View className='gap-3 px-4 pt-4'>
                            <Text
                                variant='label'
                                color='secondary'
                            >
                                Category
                            </Text>
                            <View className='flex-row flex-wrap gap-2'>
                                {CATEGORY_OPTIONS.map((cat) => (
                                    <Chip
                                        key={cat}
                                        label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        selected={draft.category === cat}
                                        onPress={() => toggle('category', cat)}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Flags */}
                        <View className='gap-3 px-4 pt-4 pb-2'>
                            <Text
                                variant='label'
                                color='secondary'
                            >
                                Flags
                            </Text>
                            <View className='flex-row gap-2'>
                                <Chip
                                    label='Duplicates only'
                                    selected={draft.duplicateFlag === true}
                                    onPress={() => toggle('duplicateFlag', true)}
                                />
                                <Chip
                                    label='Anomalies only'
                                    selected={draft.anomalyFlag === true}
                                    onPress={() => toggle('anomalyFlag', true)}
                                />
                            </View>
                        </View>
                    </ScrollView>

                    <Divider className='mt-2' />

                    {/* Actions */}
                    <View className='flex-row gap-3 px-4 pt-4'>
                        <Button
                            variant='secondary'
                            size='md'
                            onPress={() => setDraft({})}
                            className='flex-1'
                        >
                            Clear all
                        </Button>
                        <Button
                            variant='primary'
                            size='md'
                            onPress={handleApply}
                            className='flex-1'
                        >
                            {activeCount > 0 ? `Apply (${activeCount})` : 'Apply'}
                        </Button>
                    </View>
                </View>
            </Modal>
        </React.Fragment>
    );
}
