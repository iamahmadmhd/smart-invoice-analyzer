import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../atoms/text';

export interface SectionHeaderProps {
    title: string;
    count?: number;
    action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, count, action }: SectionHeaderProps) {
    return (
        <View className='flex-row items-center justify-between px-4 py-2'>
            <View className='flex-row items-center gap-2'>
                <Text
                    variant='label'
                    color='secondary'
                >
                    {title}
                </Text>
                {count !== undefined && (
                    <View className='rounded bg-canvas-inset px-1.5 py-0.5 dark:bg-night-raised'>
                        <Text
                            variant='caption'
                            color='tertiary'
                        >
                            {count}
                        </Text>
                    </View>
                )}
            </View>
            {action && (
                <Pressable
                    onPress={action.onPress}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                    <Text
                        variant='caption'
                        color='brand'
                    >
                        {action.label}
                    </Text>
                </Pressable>
            )}
        </View>
    );
}
