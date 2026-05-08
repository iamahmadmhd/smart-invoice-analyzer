import { cn } from '@/lib/utils';
import { cva, VariantProps } from 'class-variance-authority';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '../atoms/icon';
import { Text } from '../atoms/text';

const alertVariants = cva('flex-row items-start gap-3 rounded-lg p-4 border', {
    variants: {
        variant: {
            error: 'bg-crimson-subtle dark:bg-crimson-night-subtle border-crimson-border dark:border-crimson-border/30',
            success:
                'bg-jade-subtle dark:bg-jade-night-subtle border-jade-border dark:border-jade-border/30',
            warning:
                'bg-amber-subtle dark:bg-amber-night-subtle border-amber-border dark:border-amber-border/30',
            info: 'bg-azure-subtle dark:bg-azure-night-subtle border-azure-border dark:border-azure-border/30',
        },
    },
    defaultVariants: { variant: 'info' },
});

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>['variant']>;

const iconConfig: Record<
    AlertVariant,
    {
        iconColor: 'error' | 'success' | 'warning' | 'brand';
        iconName: 'error' | 'success' | 'warning' | 'info';
        textColor: 'error' | 'success' | 'warning' | 'brand';
    }
> = {
    error: { iconColor: 'error', iconName: 'error', textColor: 'error' },
    success: { iconColor: 'success', iconName: 'success', textColor: 'success' },
    warning: { iconColor: 'warning', iconName: 'warning', textColor: 'warning' },
    info: { iconColor: 'brand', iconName: 'info', textColor: 'brand' },
};

export interface AlertBannerProps extends VariantProps<typeof alertVariants> {
    title?: string;
    message: string;
    onDismiss?: () => void;
    className?: string;
}

export function AlertBanner({
    variant = 'info',
    title,
    message,
    onDismiss,
    className,
}: AlertBannerProps) {
    const { iconColor, iconName, textColor } = iconConfig[variant ?? 'info'];

    return (
        <View
            className={cn(alertVariants({ variant }), className)}
            accessibilityRole='alert'
        >
            <View className='mt-0.5'>
                <Icon
                    name={iconName}
                    size={16}
                    color={iconColor}
                />
            </View>

            <View className='flex-1 gap-0.5'>
                {title && (
                    <Text
                        variant='label'
                        color={textColor}
                    >
                        {title}
                    </Text>
                )}
                <Text
                    variant='body-small'
                    color='secondary'
                >
                    {message}
                </Text>
            </View>

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
