import { cn } from '@/lib/utils';
import { cva, VariantProps } from 'class-variance-authority';
import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

const textVariants = cva('', {
    variants: {
        variant: {
            display: 'text-4xl font-jakarta-bold tracking-tight',
            heading1: 'text-3xl font-jakarta-bold tracking-tight',
            heading2: 'text-2xl font-jakarta-bold',
            heading3: 'text-xl font-jakarta-semibold',
            heading4: 'text-lg font-jakarta-semibold',
            body: 'text-base font-jakarta',
            'body-medium': 'text-base font-jakarta-medium',
            'body-semibold': 'text-base font-jakarta-semibold',
            'body-small': 'text-sm font-jakarta',
            label: 'text-sm font-jakarta-semibold',
            'label-small': 'text-xs font-jakarta-semibold tracking-wider uppercase',
            caption: 'text-xs font-jakarta',
            mono: 'text-sm font-jakarta-medium',
        },
        color: {
            primary: 'text-ink dark:text-cloud',
            secondary: 'text-ink-muted dark:text-cloud-muted',
            tertiary: 'text-ink-faint dark:text-cloud-faint',
            inverse: 'text-ink-inverse dark:text-ink',
            brand: 'text-brand',
            error: 'text-ink',
            success: 'text-jade',
            warning: 'text-amber',
            disabled: 'text-ink-faint dark:text-cloud-faint opacity-50',
        },
    },
    defaultVariants: {
        variant: 'body',
        color: 'primary',
    },
});

export interface TextProps extends RNTextProps, VariantProps<typeof textVariants> {
    children?: React.ReactNode;
}

export function Text({ variant, color, className, ...props }: TextProps) {
    return (
        <RNText
            className={cn(textVariants({ variant, color }), className)}
            {...props}
        />
    );
}
