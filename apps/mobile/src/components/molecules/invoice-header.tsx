import React from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '../atoms/icon';
import { Text } from '../atoms/text';

export interface InvoiceHeaderProps {
    title: string;
    loading?: boolean;
    onBack: () => void;
}

export function InvoiceHeader({ title, loading = false, onBack }: InvoiceHeaderProps) {
    return (
        <View className='flex-row items-center gap-3 pt-4 pb-3'>
            <Pressable
                onPress={onBack}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                accessibilityLabel='Go back'
            >
                <Icon
                    name='back'
                    size={20}
                    color='primary'
                />
            </Pressable>
            <Text
                variant='heading4'
                color='primary'
                className='flex-1'
                numberOfLines={1}
            >
                {loading ? 'Invoice Detail' : title}
            </Text>
        </View>
    );
}
