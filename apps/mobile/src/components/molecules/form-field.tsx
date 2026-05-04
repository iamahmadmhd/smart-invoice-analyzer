import React, { forwardRef } from 'react';
import { TextInput, View } from 'react-native';
import { Input, InputProps } from '../atoms/input';
import { Text } from '../atoms/text';

export interface FormFieldProps extends InputProps {
    label: string;
    error?: string;
}

export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
    { label, error, ...inputProps },
    ref
) {
    return (
        <View className='space-y-1.5'>
            <Text
                variant='label'
                color='secondary'
            >
                {label}
            </Text>
            <Input
                ref={ref}
                state={error ? 'error' : 'default'}
                {...inputProps}
            />
            {error && (
                <Text
                    variant='caption'
                    color='error'
                >
                    {error}
                </Text>
            )}
        </View>
    );
});
