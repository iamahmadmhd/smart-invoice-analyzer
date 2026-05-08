import { colors } from '@/constants/theme';
import React, { useRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from './text';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OtpInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    autoFocus?: boolean;
    disabled?: boolean;
    /** Called when last digit is entered */
    onComplete?: (value: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OtpInput({
    length = 6,
    value,
    onChange,
    autoFocus = false,
    disabled = false,
    onComplete,
}: OtpInputProps) {
    const inputRef = useRef<TextInput>(null);

    // Pad or trim value to exactly `length` chars for display
    const digits = Array.from({ length }, (_, i) => value[i] ?? '');

    const handleChangeText = (text: string) => {
        // Strip non-digits (handles paste of "123 456", spaces, dashes, etc.)
        const cleaned = text.replace(/\D/g, '').slice(0, length);
        onChange(cleaned);
        if (cleaned.length === length) {
            onComplete?.(cleaned);
        }
    };

    // Tapping anywhere on the component — or the wrapping Pressable — focuses
    // the hidden input, so the OTP box never becomes un-editable.
    const focus = () => {
        if (!disabled) inputRef.current?.focus();
    };

    return (
        <Pressable
            onPress={focus}
            accessibilityLabel='One-time password input'
            accessibilityRole='none'
        >
            {/* Visual digit boxes ─────────────────────────────────────── */}
            <View className='flex-row justify-between gap-2'>
                {digits.map((digit, index) => {
                    const isFocused = !disabled && value.length === index;
                    const isFilled = digit !== '';

                    const boxClasses = [
                        'flex-1 h-14 rounded-xl items-center justify-center',
                        'border-2',
                        isFocused
                            ? 'border-brand bg-canvas dark:bg-night-inset'
                            : isFilled
                              ? 'border-wire-strong dark:border-wire-night-strong bg-canvas dark:bg-night-inset'
                              : 'border-wire dark:border-wire-night bg-canvas-subtle dark:bg-night-subtle',
                    ]
                        .filter(Boolean)
                        .join(' ');

                    return (
                        <View
                            key={index}
                            className={boxClasses}
                        >
                            {isFocused && !isFilled ? (
                                // Blinking cursor placeholder
                                <View className='h-5 w-px bg-brand opacity-80' />
                            ) : (
                                <Text
                                    variant='heading3'
                                    color={isFilled ? 'primary' : 'tertiary'}
                                >
                                    {digit || '·'}
                                </Text>
                            )}
                        </View>
                    );
                })}
            </View>

            {/*
             * Hidden TextInput — positioned absolutely over the whole
             * component so ANY tap in the area triggers focus. Opacity of
             * 0.01 (not 0) keeps it interactive and paste-menu enabled.
             *
             * contextMenuHidden={false}  → system paste menu stays available
             * selectTextOnFocus={false}  → avoids unexpected selection flash
             * caretHidden                → cursor lives in the visual boxes
             */}
            <TextInput
                ref={inputRef}
                value={value}
                onChangeText={handleChangeText}
                keyboardType='number-pad'
                maxLength={length}
                autoFocus={autoFocus}
                editable={!disabled}
                caretHidden
                contextMenuHidden={false}
                selectTextOnFocus={false}
                autoComplete='one-time-code'
                textContentType='oneTimeCode'
                importantForAccessibility='no-hide-descendants'
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.01,
                    color: 'transparent',
                    // Ensures it never intercepts visual focus-ring rendering
                    zIndex: 1,
                }}
                // Keep the selection at the end so backspace works naturally
                selection={{ start: value.length, end: value.length }}
                selectionColor={colors.brand}
            />
        </Pressable>
    );
}
