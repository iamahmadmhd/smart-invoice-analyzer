import { colors } from '@/constants/theme';
import { cn } from '@/lib/utils';
import React, { forwardRef } from 'react';
import { Pressable, TextInput, TextInputProps, View } from 'react-native';
import { Icon } from '../atoms/icon';

export interface SearchBarProps extends Omit<TextInputProps, 'style'> {
    value: string;
    onChangeText: (text: string) => void;
    onClear?: () => void;
    className?: string;
}

export const SearchBar = forwardRef<TextInput, SearchBarProps>(function SearchBar(
    { value, onChangeText, onClear, className, ...props },
    ref
) {
    return (
        <View
            className={cn(
                'h-11 flex-row items-center gap-2.5 rounded-xl px-3.5',
                'border border-wire bg-canvas-inset dark:border-wire-night dark:bg-night-inset',
                className
            )}
        >
            <Icon
                name='search'
                size={16}
                color='tertiary'
            />
            <TextInput
                ref={ref}
                value={value}
                onChangeText={onChangeText}
                placeholder='Search invoices…'
                placeholderTextColor={colors.inkFaint}
                returnKeyType='search'
                autoCapitalize='none'
                autoCorrect={false}
                className='flex-1 text-sm text-ink dark:text-cloud'
                style={{ fontFamily: 'PlusJakartaSans_400Regular', lineHeight: 0 }}
                {...props}
            />
            {value.length > 0 && (
                <Pressable
                    onPress={() => {
                        onChangeText('');
                        onClear?.();
                    }}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    accessibilityLabel='Clear search'
                >
                    <Icon
                        name='close'
                        size={14}
                        color='tertiary'
                    />
                </Pressable>
            )}
        </View>
    );
});
