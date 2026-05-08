import { colors } from '@/constants/theme';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import React from 'react';
import { useColorScheme } from 'react-native';

// ─── Semantic icon map ────────────────────────────────────────────────────────
// Maps app-level semantic names to SF Symbol / Material Symbol names.
// On iOS: SF Symbols. On Android/web: Material Symbols (mapped by expo-symbols).

export const iconMap = {
    home: { ios: 'house.fill', android: 'home', web: 'home' },
    back: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
    forward: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
    close: { ios: 'xmark', android: 'close', web: 'close' },
    menu: { ios: 'line.3.horizontal', android: 'menu', web: 'menu' },
    upload: { ios: 'arrow.up.doc.fill', android: 'upload_file', web: 'upload_file' },
    download: { ios: 'arrow.down.circle.fill', android: 'download', web: 'download' },
    export: { ios: 'square.and.arrow.up', android: 'share', web: 'share' },
    share: { ios: 'square.and.arrow.up', android: 'share', web: 'share' },
    search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
    filter: {
        ios: 'line.3.horizontal.decrease.circle',
        android: 'filter_list',
        web: 'filter_list',
    },
    sort: { ios: 'arrow.up.arrow.down', android: 'sort', web: 'sort' },
    edit: { ios: 'pencil', android: 'edit', web: 'edit' },
    trash: { ios: 'trash.fill', android: 'delete', web: 'delete' },
    plus: { ios: 'plus', android: 'add', web: 'add' },
    plusCircle: { ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' },
    more: { ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' },
    refresh: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
    camera: { ios: 'camera.fill', android: 'camera_alt', web: 'camera_alt' },
    success: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
    error: { ios: 'exclamationmark.circle.fill', android: 'error', web: 'error' },
    warning: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
    info: { ios: 'info.circle.fill', android: 'info', web: 'info' },
    flag: { ios: 'flag.fill', android: 'flag', web: 'flag' },
    duplicate: { ios: 'doc.on.doc.fill', android: 'content_copy', web: 'content_copy' },
    invoice: { ios: 'doc.text.fill', android: 'description', web: 'description' },
    invoices: { ios: 'doc.text', android: 'description', web: 'description' },
    receipt: { ios: 'list.bullet.clipboard', android: 'receipt', web: 'receipt' },
    vendor: { ios: 'building.2.fill', android: 'business', web: 'business' },
    calendar: { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' },
    euro: { ios: 'eurosign.circle.fill', android: 'euro', web: 'euro' },
    chart: { ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' },
    tag: { ios: 'tag.fill', android: 'label', web: 'label' },
    category: { ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' },
    eye: { ios: 'eye', android: 'visibility', web: 'visibility' },
    eyeOff: { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' },
    email: { ios: 'envelope.fill', android: 'email', web: 'email' },
    lock: { ios: 'lock.fill', android: 'lock', web: 'lock' },
    user: { ios: 'person.fill', android: 'person', web: 'person' },
    settings: { ios: 'gear', android: 'settings', web: 'settings' },
    bell: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
    help: { ios: 'questionmark.circle.fill', android: 'help', web: 'help' },
    logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
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
