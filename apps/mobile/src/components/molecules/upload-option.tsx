import React from 'react';
import { Pressable, View } from 'react-native';
import { Icon, IconName } from '../atoms/icon';
import { Text } from '../atoms/text';

export interface UploadOptionProps {
    icon: IconName;
    title: string;
    subtitle?: string;
    onPress: () => void;
    disabled?: boolean;
}

export function UploadOption({ icon, title, subtitle, onPress, disabled }: UploadOptionProps) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            className='flex-row items-center gap-4 rounded-xl px-4 py-3.5 active:bg-canvas-inset dark:active:bg-night-inset'
            accessibilityRole='button'
        >
            <View className='h-11 w-11 items-center justify-center rounded-xl bg-brand-subtle dark:bg-night-raised'>
                <Icon
                    name={icon}
                    size={20}
                    color='brand'
                />
            </View>
            <View className='flex-1 gap-0.5'>
                <Text
                    variant='body-medium'
                    color={disabled ? 'tertiary' : 'primary'}
                >
                    {title}
                </Text>
                {subtitle && (
                    <Text
                        variant='caption'
                        color='tertiary'
                    >
                        {subtitle}
                    </Text>
                )}
            </View>
            <Icon
                name='forward'
                size={16}
                color='tertiary'
            />
        </Pressable>
    );
}
