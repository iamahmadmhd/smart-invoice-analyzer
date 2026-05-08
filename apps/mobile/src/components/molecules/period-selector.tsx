import { ExportPeriod } from '@smart-invoice-analyzer/contracts';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip } from '../atoms/chip';
import { Text } from '../atoms/text';

export interface PeriodSelectorProps {
    value?: ExportPeriod;
    onChange: (period: ExportPeriod) => void;
}

type PeriodType = 'month' | 'quarter' | 'year';

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const QUARTERS = ['Q1 (Jan–Mar)', 'Q2 (Apr–Jun)', 'Q3 (Jul–Sep)', 'Q4 (Oct–Dec)'];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear - 1, currentYear - 2];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
    const [type, setType] = useState<PeriodType>(value?.type ?? 'month');
    const [year, setYear] = useState<number>(value?.year ?? currentYear);

    const selectType = (t: PeriodType) => {
        setType(t);
    };

    const selectYear = (y: number) => {
        setYear(y);
        // Reset sub-selection when year changes
        if (type === 'year') {
            onChange({ type: 'year', year: y });
        }
    };

    const selectMonth = (month: number) => {
        onChange({ type: 'month', year, month });
    };

    const selectQuarter = (quarter: number) => {
        onChange({ type: 'quarter', year, quarter });
    };

    return (
        <View className='gap-5'>
            {/* Type selector */}
            <View className='gap-2'>
                <Text
                    variant='label'
                    color='secondary'
                >
                    Period type
                </Text>
                <View className='flex-row gap-2'>
                    {(['month', 'quarter', 'year'] as PeriodType[]).map((t) => (
                        <Chip
                            key={t}
                            label={t.charAt(0).toUpperCase() + t.slice(1)}
                            selected={type === t}
                            onPress={() => selectType(t)}
                        />
                    ))}
                </View>
            </View>

            {/* Year selector */}
            <View className='gap-2'>
                <Text
                    variant='label'
                    color='secondary'
                >
                    Year
                </Text>
                <View className='flex-row gap-2'>
                    {YEARS.map((y) => (
                        <Chip
                            key={y}
                            label={String(y)}
                            selected={year === y}
                            onPress={() => selectYear(y)}
                        />
                    ))}
                </View>
            </View>

            {/* Month selector */}
            {type === 'month' && (
                <View className='gap-2'>
                    <Text
                        variant='label'
                        color='secondary'
                    >
                        Month
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerClassName='gap-2 py-0.5'
                    >
                        {MONTHS.map((m, i) => (
                            <Chip
                                key={m}
                                label={m.slice(0, 3)}
                                selected={
                                    value?.type === 'month' &&
                                    value.month === i + 1 &&
                                    value.year === year
                                }
                                onPress={() => selectMonth(i + 1)}
                            />
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Quarter selector */}
            {type === 'quarter' && (
                <View className='gap-2'>
                    <Text
                        variant='label'
                        color='secondary'
                    >
                        Quarter
                    </Text>
                    <View className='flex-row flex-wrap gap-2'>
                        {QUARTERS.map((q, i) => (
                            <Chip
                                key={q}
                                label={q}
                                selected={
                                    value?.type === 'quarter' &&
                                    value.quarter === i + 1 &&
                                    value.year === year
                                }
                                onPress={() => selectQuarter(i + 1)}
                            />
                        ))}
                    </View>
                </View>
            )}

            {/* Year — auto-selects on year pick */}
            {type === 'year' && (
                <View className='rounded-xl border border-wire bg-canvas-inset px-4 py-3 dark:border-wire-night dark:bg-night-inset'>
                    <Text
                        variant='body-small'
                        color='secondary'
                    >
                        Full year {year} will be exported (Jan 1 – Dec 31)
                    </Text>
                </View>
            )}
        </View>
    );
}
