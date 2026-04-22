import { cn } from '@/lib/utils';
import { cva, VariantProps } from 'class-variance-authority';
import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, View } from 'react-native';
import { Text } from './text';

const buttonVariants = cva('flex-row items-center justify-center rounded-lg active:opacity-80', {
    variants: {
        variant: {
            primary: 'bg-brand',
            secondary:
                'bg-canvas-inset border border-wire dark:bg-night-raised dark:border-wire-night',
            ghost: 'bg-transparent',
            destructive: 'bg-crimson',
        },
        size: {
            sm: 'h-8 px-3 gap-1.5 rounded-md',
            md: 'h-11 px-4 gap-2',
            lg: 'h-14 px-6 gap-2.5 rounded-xl',
        },
    },
    defaultVariants: {
        variant: 'primary',
        size: 'md',
    },
});

const spinnerColors: Record<string, string> = {
    primary: '#ffffff',
    secondary: '#5469d4',
    ghost: '#5469d4',
    destructive: '#ffffff',
};

const labelVariants = {
    primary: 'inverse',
    secondary: 'primary',
    ghost: 'brand',
    destructive: 'inverse',
} as const;

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
    extends Omit<PressableProps, 'children'>, VariantProps<typeof buttonVariants> {
    children: string;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <Pressable
            className={cn(
                buttonVariants({ variant, size }),
                isDisabled && 'opacity-40',
                fullWidth ? 'w-full' : 'self-start',
                className
            )}
            disabled={isDisabled}
            accessibilityRole='button'
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    size='small'
                    color={spinnerColors[variant ?? 'primary']}
                />
            ) : (
                <>
                    {leftIcon && <View>{leftIcon}</View>}
                    <Text
                        variant={size === 'sm' ? 'label' : 'body-semibold'}
                        color={labelVariants[variant ?? 'primary']}
                        className={
                            size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-sm' : 'text-base'
                        }
                    >
                        {children}
                    </Text>
                    {rightIcon && <View>{rightIcon}</View>}
                </>
            )}
        </Pressable>
    );
}
