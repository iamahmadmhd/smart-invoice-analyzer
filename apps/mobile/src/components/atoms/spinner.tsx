import { colors } from '@/constants/theme';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Text } from './text';

// ─── Spinner ──────────────────────────────────────────────────────────────────

type SpinnerSize = 'sm' | 'md' | 'lg';
type SpinnerColor = 'brand' | 'white' | 'muted';

export interface SpinnerProps {
    size?: SpinnerSize;
    color?: SpinnerColor;
    className?: string;
}

const spinnerSizeMap: Record<SpinnerSize, 'small' | 'large'> = {
    sm: 'small',
    md: 'small',
    lg: 'large',
};

const spinnerColorMap: Record<SpinnerColor, string> = {
    brand: colors.brand,
    white: '#ffffff',
    muted: colors.inkFaint,
};

export function Spinner({ size = 'md', color = 'brand', className = '' }: SpinnerProps) {
    return (
        <ActivityIndicator
            size={spinnerSizeMap[size]}
            color={spinnerColorMap[color]}
            className={className}
            accessibilityLabel='Loading'
        />
    );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps {
    orientation?: DividerOrientation;
    /** Optional centred label (horizontal only) */
    label?: string;
    className?: string;
}

export function Divider({ orientation = 'horizontal', label, className = '' }: DividerProps) {
    if (orientation === 'vertical') {
        return <View className={`w-px self-stretch bg-wire dark:bg-wire-night ${className}`} />;
    }

    if (label) {
        return (
            <View className={`flex-row items-center gap-3 ${className}`}>
                <View className='h-px flex-1 bg-wire dark:bg-wire-night' />
                <Text
                    variant='caption'
                    color='tertiary'
                >
                    {label}
                </Text>
                <View className='h-px flex-1 bg-wire dark:bg-wire-night' />
            </View>
        );
    }

    return <View className={`h-px w-full bg-wire dark:bg-wire-night ${className}`} />;
}
