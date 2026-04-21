import { colors } from '@/constants/theme';
import { SymbolView } from 'expo-symbols';
import React, { forwardRef, useState } from 'react';
import { Pressable, TextInput, TextInputProps, View } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type InputSize = 'sm' | 'md' | 'lg';
type InputState = 'default' | 'focused' | 'error' | 'success' | 'disabled';

export interface InputProps extends Omit<TextInputProps, 'editable'> {
    size?: InputSize;
    state?: InputState;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    /** Automatically adds password toggle icon */
    isPassword?: boolean;
    disabled?: boolean;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const containerSizes: Record<InputSize, string> = {
    sm: 'h-9  rounded-md  px-3',
    md: 'h-11 rounded-lg  px-4',
    lg: 'h-14 rounded-xl  px-4',
};

const containerStates: Record<InputState, string> = {
    default: 'border border-wire      dark:border-wire-night',
    focused: 'border-2 border-brand',
    error: 'border-2 border-crimson',
    success: 'border-2 border-jade',
    disabled: 'border border-wire      dark:border-wire-night opacity-50',
};

const containerBase = 'flex-row items-center bg-canvas dark:bg-night-inset';

const textSizes: Record<InputSize, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
};

// ─── Component ────────────────────────────────────────────────────────────────

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
        className = '',
        style,
        ...props
    },
    ref
) {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Derive current state (controlled state takes priority)
    const currentState: InputState = disabled
        ? 'disabled'
        : (controlledState ?? (focused ? 'focused' : 'default'));

    const containerClasses = [
        containerBase,
        containerSizes[size],
        containerStates[currentState],
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
    const iconColor = focused ? colors.brand : colors.inkFaint;

    return (
        <View className={containerClasses}>
            {/* Left icon */}
            {leftIcon && <View className='mr-2.5 opacity-60'>{leftIcon}</View>}

            {/* Text input */}
            <TextInput
                ref={ref}
                className={`flex-1 text-ink dark:text-cloud ${textSizes[size]}`}
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
                style={[{ fontFamily: 'PlusJakartaSans_400Regular' }, style as object]}
                {...props}
            />

            {/* Password toggle */}
            {isPassword && (
                <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    className='ml-2.5'
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                    <SymbolView
                        name={showPassword ? 'eye.slash' : 'eye'}
                        size={iconSize}
                        tintColor={iconColor}
                    />
                </Pressable>
            )}

            {/* Right icon (shown only when no password toggle) */}
            {rightIcon && !isPassword && <View className='ml-2.5 opacity-60'>{rightIcon}</View>}

            {/* State indicator icon */}
            {currentState === 'error' && !rightIcon && !isPassword && (
                <SymbolView
                    name='exclamationmark.circle.fill'
                    size={iconSize}
                    tintColor={colors.crimson}
                    style={{ marginLeft: 8 }}
                />
            )}
            {currentState === 'success' && !rightIcon && !isPassword && (
                <SymbolView
                    name='checkmark.circle.fill'
                    size={iconSize}
                    tintColor={colors.jade}
                    style={{ marginLeft: 8 }}
                />
            )}
        </View>
    );
});
