import React, { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../atoms/button';
import { Text } from '../atoms/text';
import { AlertBanner } from '../molecules/alert-banner';
import { FormField } from '../molecules/form-field';

export interface AuthFormProps {
    type: 'signin' | 'signup';
    loading: boolean;
    error?: string;
    onSubmit: (data: { email: string; password: string; confirmPassword?: string }) => void;
    onClearError: () => void;
}

export function AuthForm({ type, loading, error, onSubmit, onClearError }: AuthFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const isSignUp = type === 'signup';
    const canSubmit = email.trim() && password && (!isSignUp || confirmPassword);

    const handleSubmit = () => {
        onSubmit({
            email: email.trim().toLowerCase(),
            password,
            ...(isSignUp && { confirmPassword }),
        });
    };

    return (
        <View className='space-y-6'>
            <View className='space-y-2'>
                <Text
                    variant='heading1'
                    color='primary'
                >
                    {isSignUp ? 'Create account' : 'Welcome back'}
                </Text>
                <Text
                    variant='body'
                    color='secondary'
                >
                    {isSignUp
                        ? 'Enter your details to get started'
                        : 'Sign in to your account to continue'}
                </Text>
            </View>

            {error && (
                <AlertBanner
                    variant='error'
                    message={error}
                    onDismiss={onClearError}
                />
            )}

            <View className='space-y-4'>
                <FormField
                    label='Email'
                    placeholder='you@example.com'
                    value={email}
                    onChangeText={setEmail}
                    keyboardType='email-address'
                    autoCapitalize='none'
                />

                <FormField
                    label='Password'
                    placeholder={isSignUp ? 'At least 8 characters' : 'Enter your password'}
                    value={password}
                    onChangeText={setPassword}
                    isPassword
                />

                {isSignUp && (
                    <FormField
                        label='Confirm Password'
                        placeholder='Repeat your password'
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        isPassword
                    />
                )}
            </View>

            <Button
                loading={loading}
                disabled={!canSubmit}
                fullWidth
                onPress={handleSubmit}
            >
                {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
        </View>
    );
}
