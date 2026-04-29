import React from 'react';
import { Platform, ScrollView, View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface ScreenContainerProps extends ViewProps {
    children: React.ReactNode;
    scrollable?: boolean;
}

/**
 * Wraps every screen. On web it centres content and caps width at max-w-lg.
 * On native it's a transparent passthrough — screens own their own bg.
 */
export function ScreenContainer({
    children,
    scrollable = false,
    className,
    ...props
}: ScreenContainerProps) {
    const isWeb = Platform.OS === 'web';

    const inner = (
        <View
            className={cn('w-full flex-1', isWeb && 'mx-auto max-w-lg', className)}
            {...props}
        >
            {children}
        </View>
    );

    if (!isWeb) return <>{children}</>;

    if (scrollable) {
        return (
            <ScrollView
                className='flex-1'
                contentContainerClassName='items-center'
                showsVerticalScrollIndicator={false}
            >
                {inner}
            </ScrollView>
        );
    }

    return <View className='flex-1 items-center bg-canvas-subtle dark:bg-night'>{inner}</View>;
}
