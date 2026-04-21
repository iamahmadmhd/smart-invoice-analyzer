import { colors } from '@/constants/theme';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import React from 'react';
import { useColorScheme } from 'react-native';

// ─── Semantic icon map ────────────────────────────────────────────────────────
// Maps app-level semantic names to SF Symbol / Material Symbol names.
// On iOS: SF Symbols. On Android/web: Material Symbols (mapped by expo-symbols).

export const iconMap = {
    // Navigation
    home: 'house.fill',
    back: 'chevron.left',
    forward: 'chevron.right',
    close: 'xmark',
    menu: 'line.3.horizontal',

    // Actions
    upload: 'arrow.up.doc.fill',
    download: 'arrow.down.circle.fill',
    export: 'square.and.arrow.up',
    share: 'square.and.arrow.up',
    search: 'magnifyingglass',
    filter: 'line.3.horizontal.decrease.circle',
    sort: 'arrow.up.arrow.down',
    edit: 'pencil',
    trash: 'trash.fill',
    plus: 'plus',
    plusCircle: 'plus.circle.fill',
    more: 'ellipsis',
    refresh: 'arrow.clockwise',
    camera: 'camera.fill',

    // Status / feedback
    success: 'checkmark.circle.fill',
    error: 'exclamationmark.circle.fill',
    warning: 'exclamationmark.triangle.fill',
    info: 'info.circle.fill',
    flag: 'flag.fill',
    duplicate: 'doc.on.doc.fill',

    // Domain — invoices
    invoice: 'doc.text.fill',
    invoices: 'doc.text',
    receipt: 'list.bullet.clipboard',
    vendor: 'building.2.fill',
    calendar: 'calendar',
    euro: 'eurosign.circle.fill',
    chart: 'chart.bar.fill',
    tag: 'tag.fill',
    category: 'square.grid.2x2.fill',

    // Auth
    eye: 'eye',
    eyeOff: 'eye.slash',
    email: 'envelope.fill',
    lock: 'lock.fill',
    user: 'person.fill',

    // Settings
    settings: 'gear',
    bell: 'bell.fill',
    help: 'questionmark.circle.fill',
    logout: 'rectangle.portrait.and.arrow.right',
} as const;

export type IconName = keyof typeof iconMap;

// ─── Color presets ────────────────────────────────────────────────────────────

type IconColor =
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'brand'
    | 'inverse'
    | 'error'
    | 'success'
    | 'warning'
    | 'disabled';

// ─── Component ────────────────────────────────────────────────────────────────

export interface IconProps {
    name: IconName;
    size?: number;
    color?: IconColor;
    /** Direct hex override — use sparingly; prefer color prop */
    tintColor?: string;
    type?: SymbolViewProps['type'];
    weight?: SymbolViewProps['weight'];
    /** Additional styles for the underlying SymbolView */
    style?: SymbolViewProps['style'];
}

export function Icon({
    name,
    size = 20,
    color = 'primary',
    tintColor: tintColorOverride,
    type = 'monochrome',
    weight,
    style,
}: IconProps) {
    const scheme = useColorScheme();
    const dark = scheme === 'dark';

    const resolvedColor = tintColorOverride ?? resolveIconColor(color, dark);

    return (
        <SymbolView
            name={iconMap[name]}
            size={size}
            tintColor={resolvedColor}
            type={type}
            weight={weight}
            style={style}
        />
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveIconColor(color: IconColor, dark: boolean): string {
    switch (color) {
        case 'primary':
            return dark ? colors.cloud : colors.ink;
        case 'secondary':
            return dark ? colors.cloudMuted : colors.inkMuted;
        case 'tertiary':
            return dark ? colors.cloudFaint : colors.inkFaint;
        case 'brand':
            return colors.brand;
        case 'inverse':
            return dark ? colors.ink : colors.cloud;
        case 'error':
            return colors.crimson;
        case 'success':
            return colors.jade;
        case 'warning':
            return colors.amber;
        case 'disabled':
            return dark ? colors.cloudFaint : colors.inkFaint;
    }
}
