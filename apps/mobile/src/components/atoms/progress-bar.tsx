import { cn } from '@/lib/utils';
import React from 'react';
import { View } from 'react-native';

export interface ProgressBarProps {
    value: number; // 0–100
    className?: string;
    trackClassName?: string;
    fillClassName?: string;
    height?: number;
}

export function ProgressBar({
    value,
    className,
    trackClassName,
    fillClassName,
    height = 4,
}: ProgressBarProps) {
    const clamped = Math.min(100, Math.max(0, value));

    return (
        <View
            className={cn('w-full overflow-hidden rounded-full', className)}
            style={{ height }}
            accessibilityRole='progressbar'
            accessibilityValue={{ min: 0, max: 100, now: clamped }}
        >
            <View
                className={cn(
                    'h-full rounded-full bg-canvas-inset dark:bg-night-raised',
                    trackClassName
                )}
            />
            <View
                className={cn('absolute top-0 left-0 h-full rounded-full bg-brand', fillClassName)}
                style={{ width: `${clamped}%` }}
            />
        </View>
    );
}
