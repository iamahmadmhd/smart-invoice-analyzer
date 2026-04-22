import { cn } from '@/lib/utils';
import React, { forwardRef } from 'react';
import { TextInput, View } from 'react-native';
import { Input, InputProps } from '../atoms/input';
import { Text } from '../atoms/text';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FormFieldProps extends InputProps {
    label?: string;
    helper?: string;
    error?: string;
    required?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
    { label, helper, error, required = false, state: controlledState, ...inputProps },
    ref
) {
    // Automatically set error state if error message is provided
    const state = error ? 'error' : controlledState;

    return (
        <View className={cn('gap-1.5', inputProps.className)}>
            {/* Label */}
            {label && (
                <View className='flex-row items-center gap-1'>
                    <Text
                        variant='label'
                        color='secondary'
                    >
                        {label}
                    </Text>
                    {required && (
                        <Text
                            variant='label'
                            color='error'
                        >
                            *
                        </Text>
                    )}
                </View>
            )}

            {/* Input */}
            <Input
                ref={ref}
                state={state}
                {...inputProps}
            />

            {/* Error or helper text */}
            {error ? (
                <Text
                    variant='caption'
                    color='error'
                >
                    {error}
                </Text>
            ) : helper ? (
                <Text
                    variant='caption'
                    color='tertiary'
                >
                    {helper}
                </Text>
            ) : null}
        </View>
    );
});
