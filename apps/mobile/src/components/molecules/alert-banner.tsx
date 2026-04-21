import React from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '../atoms/icon';
import { Text } from '../atoms/text';

// ─── Types ────────────────────────────────────────────────────────────────────

type AlertVariant = 'error' | 'success' | 'warning' | 'info';

export interface AlertBannerProps {
    variant: AlertVariant;
    title?: string;
    message: string;
    onDismiss?: () => void;
    className?: string;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const variantConfig: Record<
    AlertVariant,
    {
        container: string;
        border: string;
        iconColor: 'error' | 'success' | 'warning' | 'brand';
        iconName: 'error' | 'success' | 'warning' | 'info';
        textColor: 'error' | 'success' | 'warning' | 'brand';
    }
> = {
    error: {
        container: 'bg-crimson-subtle dark:bg-crimson-night-subtle',
        border: 'border border-crimson-border dark:border-crimson-border/30',
        iconColor: 'error',
        iconName: 'error',
        textColor: 'error',
    },
    success: {
        container: 'bg-jade-subtle dark:bg-jade-night-subtle',
        border: 'border border-jade-border dark:border-jade-border/30',
        iconColor: 'success',
        iconName: 'success',
        textColor: 'success',
    },
    warning: {
        container: 'bg-amber-subtle dark:bg-amber-night-subtle',
        border: 'border border-amber-border dark:border-amber-border/30',
        iconColor: 'warning',
        iconName: 'warning',
        textColor: 'warning',
    },
    info: {
        container: 'bg-azure-subtle dark:bg-azure-night-subtle',
        border: 'border border-azure-border dark:border-azure-border/30',
        iconColor: 'brand',
        iconName: 'info',
        textColor: 'brand',
    },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AlertBanner({
    variant,
    title,
    message,
    onDismiss,
    className = '',
}: AlertBannerProps) {
    const config = variantConfig[variant];

    return (
        <View
            className={`flex-row items-start gap-3 rounded-lg p-4 ${config.container} ${config.border} ${className} `}
            accessibilityRole='alert'
        >
            {/* Icon */}
            <View className='mt-0.5'>
                <Icon
                    name={config.iconName}
                    size={16}
                    color={config.iconColor}
                />
            </View>

            {/* Content */}
            <View className='flex-1 gap-0.5'>
                {title && (
                    <Text
                        variant='label'
                        color={config.textColor}
                    >
                        {title}
                    </Text>
                )}
                <Text
                    variant='bodySmall'
                    color='secondary'
                >
                    {message}
                </Text>
            </View>

            {/* Dismiss button */}
            {onDismiss && (
                <Pressable
                    onPress={onDismiss}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    accessibilityLabel='Dismiss alert'
                >
                    <Icon
                        name='close'
                        size={14}
                        color='tertiary'
                    />
                </Pressable>
            )}
        </View>
    );
}
