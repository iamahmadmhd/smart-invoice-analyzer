import { cn } from '@/lib/utils';
import { getDefaultHeaderHeight } from '@react-navigation/elements';
import React from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../atoms/text';

export interface StackHeaderProps {
    title: string;
    left?: React.ReactNode;
    right?: React.ReactNode;
    className?: string;
}

export function StackHeader({ title, left, right, className }: StackHeaderProps) {
    const insets = useSafeAreaInsets();
    const frame = useSafeAreaFrame();
    const headerHeight = getDefaultHeaderHeight(frame, false, insets.top);
    const isWeb = Platform.OS === 'web';

    return (
        <View className={cn(['bg-canvas-subtle dark:bg-night', className])}>
            <View
                style={{ height: headerHeight, paddingTop: insets.top }}
                className='flex-row items-center justify-center px-4'
            >
                {isWeb ? (
                    // Web: left slot + title on the left, right slot pushed to the end
                    <React.Fragment>
                        <View className='flex-1 flex-row items-center gap-3'>
                            {left}
                            <Text
                                variant='heading2'
                                color='primary'
                                numberOfLines={1}
                            >
                                {title}
                            </Text>
                        </View>
                        {right && <View className='flex-row gap-2'>{right}</View>}
                    </React.Fragment>
                ) : (
                    // Native: left | centred title | right
                    <React.Fragment>
                        <View className='w-10 items-start'>{left ?? null}</View>
                        <View className='flex-1 items-center'>
                            <Text
                                variant='heading2'
                                color='primary'
                                numberOfLines={1}
                            >
                                {title}
                            </Text>
                        </View>
                        <View className='min-w-10 flex-row items-end gap-2'>{right ?? null}</View>
                    </React.Fragment>
                )}
            </View>
        </View>
    );
}
