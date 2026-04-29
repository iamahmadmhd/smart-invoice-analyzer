import React from 'react';
import { View } from 'react-native';
import { Button } from '../atoms/button';
import { Icon, IconName } from '../atoms/icon';
import { Text } from '../atoms/text';

export interface EmptyStateProps {
    icon?: IconName;
    title: string;
    body?: string;
    action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon = 'invoice', title, body, action }: EmptyStateProps) {
    return (
        <View className='flex-1 items-center justify-center gap-4 px-8 py-16'>
            <View className='h-16 w-16 items-center justify-center rounded-2xl bg-canvas-inset dark:bg-night-inset'>
                <Icon
                    name={icon}
                    size={28}
                    color='tertiary'
                />
            </View>
            <View className='items-center gap-1.5'>
                <Text
                    variant='heading4'
                    color='primary'
                    className='text-center'
                >
                    {title}
                </Text>
                {body && (
                    <Text
                        variant='body-small'
                        color='secondary'
                        className='text-center'
                    >
                        {body}
                    </Text>
                )}
            </View>
            {action && (
                <Button
                    variant='secondary'
                    size='md'
                    onPress={action.onPress}
                >
                    {action.label}
                </Button>
            )}
        </View>
    );
}
