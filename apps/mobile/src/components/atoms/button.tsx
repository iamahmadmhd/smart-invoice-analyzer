import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, View } from 'react-native';
import { Text } from './text';

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
    children: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const containerBase = 'flex-row items-center justify-center rounded-lg active:opacity-80';

const containerVariants: Record<ButtonVariant, string> = {
    primary: 'bg-brand',
    secondary: 'bg-canvas-inset border border-wire dark:bg-night-raised dark:border-wire-night',
    ghost: 'bg-transparent',
    destructive: 'bg-crimson',
};

const containerSizes: Record<ButtonSize, string> = {
    sm: 'h-8  px-3 gap-1.5 rounded-md',
    md: 'h-11 px-4 gap-2',
    lg: 'h-14 px-6 gap-2.5 rounded-xl',
};

const labelVariants: Record<ButtonVariant, 'inverse' | 'primary' | 'brand' | 'error'> = {
    primary: 'inverse',
    secondary: 'primary',
    ghost: 'brand',
    destructive: 'inverse',
};

const labelSizeClasses: Record<ButtonSize, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
};

const spinnerColors: Record<ButtonVariant, string> = {
    primary: '#ffffff',
    secondary: '#5469d4',
    ghost: '#5469d4',
    destructive: '#ffffff',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = '',
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading;

    const containerClasses = [
        containerBase,
        containerVariants[variant],
        containerSizes[size],
        isDisabled ? 'opacity-40' : '',
        fullWidth ? 'w-full' : 'self-start',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <Pressable
            className={containerClasses}
            disabled={isDisabled}
            accessibilityRole='button'
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    size='small'
                    color={spinnerColors[variant]}
                />
            ) : (
                <>
                    {leftIcon && <View>{leftIcon}</View>}
                    <Text
                        variant={size === 'sm' ? 'label' : 'bodySemibold'}
                        color={labelVariants[variant]}
                        className={labelSizeClasses[size]}
                    >
                        {children}
                    </Text>
                    {rightIcon && <View>{rightIcon}</View>}
                </>
            )}
        </Pressable>
    );
}
