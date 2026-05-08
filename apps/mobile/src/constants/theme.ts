import { Platform } from 'react-native';

// ─── Shadow tokens ────────────────────────────────────────────────────────────
// React Native shadow properties can't be expressed in Tailwind classes,
// so we define them here as style objects to spread directly.

export const shadows = {
    none: {},

    xs: Platform.select({
        ios: {
            shadowColor: '#0a2540',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 2,
        },
        android: { elevation: 1 },
        default: {},
    }),

    sm: Platform.select({
        ios: {
            shadowColor: '#0a2540',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
        },
        android: { elevation: 2 },
        default: {},
    }),

    md: Platform.select({
        ios: {
            shadowColor: '#0a2540',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
        },
        android: { elevation: 4 },
        default: {},
    }),

    lg: Platform.select({
        ios: {
            shadowColor: '#0a2540',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
        },
        android: { elevation: 8 },
        default: {},
    }),

    xl: Platform.select({
        ios: {
            shadowColor: '#0a2540',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.14,
            shadowRadius: 24,
        },
        android: { elevation: 12 },
        default: {},
    }),
} as const;

// Dark mode variants (stronger shadow with lighter base)
export const shadowsDark = {
    none: {},

    xs: Platform.select({
        ios: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
        },
        android: { elevation: 1 },
        default: {},
    }),

    sm: Platform.select({
        ios: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
        },
        android: { elevation: 2 },
        default: {},
    }),

    md: Platform.select({
        ios: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
        },
        android: { elevation: 4 },
        default: {},
    }),

    lg: Platform.select({
        ios: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
        },
        android: { elevation: 8 },
        default: {},
    }),

    xl: Platform.select({
        ios: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.45,
            shadowRadius: 24,
        },
        android: { elevation: 12 },
        default: {},
    }),
} as const;

// ─── Color constants (for use in JS/TS, e.g. icon tintColor) ─────────────────

export const colors = {
    brand: '#5469d4',
    brandHover: '#4254b8',
    brandSubtle: '#eef2ff',

    // Light
    canvas: '#ffffff',
    canvasSubtle: '#f6f9fc',
    ink: '#0a2540',
    inkMuted: '#425466',
    inkFaint: '#697386',
    wire: '#e3e8ee',
    wireStrong: '#c1c9d2',

    // Dark
    night: '#0d1117',
    nightSubtle: '#161c28',
    nightInset: '#1c2433',
    cloud: '#edf2f7',
    cloudMuted: '#a0b0c5',
    cloudFaint: '#6b7fa3',
    wireNight: '#2d3748',

    // Status
    jade: '#1a9c3e',
    jadeSubtle: '#edfaf1',
    amber: '#b45309',
    amberSubtle: '#fffbeb',
    crimson: '#df1b41',
    crimsonSubtle: '#fff1f2',
    azure: '#0570de',
    azureSubtle: '#eff8ff',
} as const;

// ─── Animation durations ──────────────────────────────────────────────────────

export const duration = {
    instant: 0,
    fast: 100,
    normal: 200,
    slow: 300,
    slower: 500,
} as const;

// ─── Hit slop (accessibility — minimum 44px touch target) ────────────────────

export const hitSlop = {
    none: undefined,
    sm: { top: 8, right: 8, bottom: 8, left: 8 },
    md: { top: 12, right: 12, bottom: 12, left: 12 },
    lg: { top: 16, right: 16, bottom: 16, left: 16 },
} as const;

export type ShadowSize = keyof typeof shadows;
export type ColorToken = keyof typeof colors;
