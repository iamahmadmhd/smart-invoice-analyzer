import React from 'react';
import { View } from 'react-native';
import { Text } from '../atoms/text';

export interface DetailRowProps {
    label: string;
    value?: string | null;
    valueMono?: boolean;
    /** Render a custom right-side element instead of a plain value */
    children?: React.ReactNode;
    /** Dim the row when value is missing */
    empty?: boolean;
}

export function DetailRow({ label, value, valueMono = false, children, empty }: DetailRowProps) {
    const displayValue = value ?? '—';
    const isEmpty = empty ?? (!value && !children);

    return (
        <View className='flex-row items-center justify-between gap-4 py-3'>
            <Text
                variant='body-small'
                color='tertiary'
                className='shrink-0'
            >
                {label}
            </Text>
            {children ? (
                <View className='flex-1 items-end'>{children}</View>
            ) : (
                <Text
                    variant={valueMono ? 'mono' : 'body-small'}
                    color={isEmpty ? 'tertiary' : 'primary'}
                    className='flex-1 text-right'
                    numberOfLines={2}
                >
                    {displayValue}
                </Text>
            )}
        </View>
    );
}
