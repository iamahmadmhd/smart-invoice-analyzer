import { cn } from '@/lib/utils';
import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { Text } from './text';

export interface ChipProps extends Omit<PressableProps, 'children'> {
    label: string;
    selected?: boolean;
    onDismiss?: () => void;
    className?: string;
}

export function Chip({ label, selected = false, onDismiss, className, ...props }: ChipProps) {
    return (
        <Pressable
            className={cn(
                'flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 active:opacity-70',
                selected
                    ? 'border-brand bg-brand'
                    : 'border-wire bg-canvas dark:border-wire-night dark:bg-night-inset',
                className
            )}
            accessibilityRole='button'
            accessibilityState={{ selected }}
            {...props}
        >
            <Text
                variant='label'
                color={selected ? 'inverse' : 'secondary'}
                className='text-xs'
            >
                {label}
            </Text>
            {onDismiss && (
                <Pressable
                    onPress={onDismiss}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 4 }}
                    accessibilityLabel={`Remove ${label} filter`}
                >
                    <Text
                        variant='caption'
                        color={selected ? 'inverse' : 'tertiary'}
                    >
                        ✕
                    </Text>
                </Pressable>
            )}
        </Pressable>
    );
}
