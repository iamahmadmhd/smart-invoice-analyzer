import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

// ─── Variant definitions ──────────────────────────────────────────────────────

type TextVariant =
    | 'display' // 36px bold  — hero numbers, invoice totals
    | 'heading1' // 30px bold  — screen titles
    | 'heading2' // 24px bold  — section headings
    | 'heading3' // 20px semibold — card headings
    | 'heading4' // 17px semibold — subsection headings
    | 'body' // 15px regular  — default body text
    | 'bodyMedium' // 15px medium   — emphasised body
    | 'bodySemibold' // 15px semibold — strong body
    | 'bodySmall' // 13px regular  — secondary body
    | 'label' // 13px semibold — form labels, list labels
    | 'labelSmall' // 11px semibold — caps labels, metadata
    | 'caption' // 11px regular  — helper text, timestamps
    | 'mono'; // 13px mono     — amounts, codes

type TextColor =
    | 'primary' // ink / cloud
    | 'secondary' // ink-muted / cloud-muted
    | 'tertiary' // ink-faint / cloud-faint
    | 'inverse' // always white / always ink
    | 'brand' // brand color
    | 'error' // crimson
    | 'success' // jade
    | 'warning' // amber
    | 'disabled'; // faint, non-interactive

// ─── Style maps ──────────────────────────────────────────────────────────────

const variantClasses: Record<TextVariant, string> = {
    display: 'text-4xl font-[PlusJakartaSans_700Bold] tracking-tight',
    heading1: 'text-3xl font-[PlusJakartaSans_700Bold] tracking-tight',
    heading2: 'text-2xl font-[PlusJakartaSans_700Bold]',
    heading3: 'text-xl  font-[PlusJakartaSans_600SemiBold]',
    heading4: 'text-lg  font-[PlusJakartaSans_600SemiBold]',
    body: 'text-base font-[PlusJakartaSans_400Regular]',
    bodyMedium: 'text-base font-[PlusJakartaSans_500Medium]',
    bodySemibold: 'text-base font-[PlusJakartaSans_600SemiBold]',
    bodySmall: 'text-sm  font-[PlusJakartaSans_400Regular]',
    label: 'text-sm  font-[PlusJakartaSans_600SemiBold]',
    labelSmall: 'text-xs  font-[PlusJakartaSans_600SemiBold] tracking-wider uppercase',
    caption: 'text-xs  font-[PlusJakartaSans_400Regular]',
    mono: 'text-sm  font-[PlusJakartaSans_500Medium]',
};

const colorClasses: Record<TextColor, string> = {
    primary: 'text-ink   dark:text-cloud',
    secondary: 'text-ink-muted  dark:text-cloud-muted',
    tertiary: 'text-ink-faint  dark:text-cloud-faint',
    inverse: 'text-ink-inverse dark:text-ink',
    brand: 'text-brand',
    error: 'text-crimson',
    success: 'text-jade',
    warning: 'text-amber',
    disabled: 'text-ink-faint dark:text-cloud-faint opacity-50',
};

// ─── Component ────────────────────────────────────────────────────────────────

export interface TextProps extends RNTextProps {
    variant?: TextVariant;
    color?: TextColor;
    children?: React.ReactNode;
}

export function Text({ variant = 'body', color = 'primary', className = '', ...props }: TextProps) {
    const classes = `${variantClasses[variant]} ${colorClasses[color]} ${className}`.trim();

    return (
        <RNText
            className={classes}
            {...props}
        />
    );
}
