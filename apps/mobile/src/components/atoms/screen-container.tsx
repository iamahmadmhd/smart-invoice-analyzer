import { cn } from '@/lib/utils';
import React from 'react';
import { Platform, ScrollView, ScrollViewProps, View, ViewProps } from 'react-native';

/**
 * Wraps every screen. On web it centres content and caps width at max-w-lg.
 * On native it's a transparent passthrough — screens own their own bg.
 */
export function Container({ children, className, ...props }: ViewProps) {
    const isWeb = Platform.OS === 'web';

    return (
        <View
            className={cn('flex-1 px-4', isWeb && 'mx-auto w-full max-w-lg', className)}
            {...props}
        >
            {children}
        </View>
    );
}

export function ContainerScrollable({ children, className, ...props }: ScrollViewProps) {
    const isWeb = Platform.OS === 'web';

    return (
        <ScrollView
            className={cn('flex-1 px-4', isWeb && 'mx-auto w-full max-w-lg', className)}
            {...props}
        >
            {children}
        </ScrollView>
    );
}
