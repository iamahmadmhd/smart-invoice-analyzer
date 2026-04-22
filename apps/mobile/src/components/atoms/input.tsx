import { colors } from '@/constants/theme';
import { cn } from '@/lib/utils';
import { cva, VariantProps } from 'class-variance-authority';
import { SymbolView } from 'expo-symbols';
import React, { forwardRef, useState } from 'react';
import { Pressable, TextInput, TextInputProps, View } from 'react-native';

const inputVariants = cva('flex-row items-center bg-canvas dark:bg-night-inset', {
    variants: {
        size: {
            sm: 'h-9 rounded-md px-3',
            md: 'h-11 rounded-lg px-4',
            lg: 'h-14 rounded-xl px-4',
        },
        state: {
            default: 'border border-wire dark:border-wire-night',
            focused: 'border-2 border-brand',
            error: 'border-2 border-crimson',
            success: 'border-2 border-jade',
            disabled: 'border border-wire dark:border-wire-night opacity-50',
        },
    },
    defaultVariants: {
        size: 'md',
        state: 'default',
    },
});

const textSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' } as const;

export interface InputProps
    extends Omit<TextInputProps, 'editable'>, Omit<VariantProps<typeof inputVariants>, 'state'> {
    state?: 'default' | 'focused' | 'error' | 'success' | 'disabled';
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    isPassword?: boolean;
    disabled?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
    {
        size = 'md',
        state: controlledState,
        leftIcon,
        rightIcon,
        isPassword = false,
        disabled = false,
        onFocus,
        onBlur,
        className,
        style,
        ...props
    },
    ref
) {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const currentState = disabled
        ? 'disabled'
        : (controlledState ?? (focused ? 'focused' : 'default'));

    const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
    const iconColor = focused ? colors.brand : colors.inkFaint;

    return (
        <View className={cn(inputVariants({ size, state: currentState }), className)}>
            {leftIcon && <View className='mr-2.5 opacity-60'>{leftIcon}</View>}

            <TextInput
                ref={ref}
                className={`web:user-select-auto flex-1 text-ink focus:outline-none dark:text-cloud dark:focus:outline-none web:cursor-text web:caret-brand web:select-auto ${textSizes[size ?? 'md']}`}
                placeholderTextColor={colors.inkFaint}
                editable={!disabled}
                secureTextEntry={isPassword && !showPassword}
                onFocus={(e) => {
                    setFocused(true);
                    onFocus?.(e);
                }}
                onBlur={(e) => {
                    setFocused(false);
                    onBlur?.(e);
                }}
                style={[
                    { fontFamily: 'PlusJakartaSans_400Regular', lineHeight: 0 },
                    style as object,
                ]}
                {...props}
            />

            {isPassword && (
                <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    className='ml-2.5'
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                    <SymbolView
                        name={
                            showPassword
                                ? {
                                      ios: 'eye.slash',
                                      android: 'visibility_off',
                                      web: 'visibility_off',
                                  }
                                : { ios: 'eye', android: 'visibility', web: 'visibility' }
                        }
                        size={iconSize}
                        tintColor={iconColor}
                    />
                </Pressable>
            )}

            {rightIcon && !isPassword && <View className='ml-2.5 opacity-60'>{rightIcon}</View>}

            {currentState === 'error' && !rightIcon && !isPassword && (
                <SymbolView
                    name={{ ios: 'exclamationmark.circle.fill', android: 'error', web: 'error' }}
                    size={iconSize}
                    tintColor={colors.crimson}
                    style={{ marginLeft: 8 }}
                />
            )}
            {currentState === 'success' && !rightIcon && !isPassword && (
                <SymbolView
                    name={{
                        ios: 'checkmark.circle.fill',
                        android: 'check_circle',
                        web: 'check_circle',
                    }}
                    size={iconSize}
                    tintColor={colors.jade}
                    style={{ marginLeft: 8 }}
                />
            )}
        </View>
    );
});
