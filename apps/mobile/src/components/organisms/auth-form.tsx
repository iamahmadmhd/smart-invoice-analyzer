import {
    flattenZodErrors,
    SignInFields,
    signInSchema,
    SignUpFields,
    signUpSchema,
} from '@/lib/auth-schema';
import React, { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Button } from '../atoms/button';
import { AlertBanner } from '../molecules/alert-banner';
import { FormField } from '../molecules/form-field';

export interface AuthFormProps {
    type: 'signin' | 'signup';
    loading: boolean;
    error?: string;
    onSubmit: (data: { email: string; password: string; confirmPassword?: string }) => void;
    onClearError: () => void;
    /** Sign-in only — renders "Forgot password?" below the password field */
    onForgotPassword?: (email: string) => void;
}

export function AuthForm({
    type,
    loading,
    error,
    onSubmit,
    onClearError,
    onForgotPassword,
}: AuthFormProps) {
    const isSignUp = type === 'signup';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState<
        Partial<Record<keyof SignInFields | keyof SignUpFields, string>>
    >({});

    const passwordRef = useRef<TextInput>(null);
    const confirmRef = useRef<TextInput>(null);

    const canSubmit =
        email.trim().length > 0 && password.length > 0 && (!isSignUp || confirmPassword.length > 0);

    const clearFieldError = (field: string) =>
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));

    const handleSubmit = () => {
        if (loading) return;

        const schema = isSignUp ? signUpSchema : signInSchema;
        const result = schema.safeParse({
            email: email.trim().toLowerCase(),
            password,
            confirmPassword,
        });

        if (!result.success) {
            setFieldErrors(flattenZodErrors(result.error) as typeof fieldErrors);
            return;
        }

        setFieldErrors({});
        onSubmit(
            isSignUp ? result.data : { email: result.data.email, password: result.data.password }
        );
    };

    return (
        <View className='gap-6'>
            {error && (
                <AlertBanner
                    variant='error'
                    message={error}
                    onDismiss={onClearError}
                />
            )}

            <View className='gap-4'>
                <FormField
                    label='Email'
                    placeholder='you@example.com'
                    value={email}
                    onChangeText={(v) => {
                        setEmail(v);
                        clearFieldError('email');
                    }}
                    error={fieldErrors.email}
                    keyboardType='email-address'
                    autoCapitalize='none'
                    autoCorrect={false}
                    autoComplete='email'
                    textContentType='emailAddress'
                    returnKeyType='next'
                    onSubmitEditing={() => passwordRef.current?.focus()}
                />

                <View className='gap-1.5'>
                    <FormField
                        ref={passwordRef}
                        label='Password'
                        placeholder={isSignUp ? 'At least 8 characters' : 'Enter your password'}
                        value={password}
                        onChangeText={(v) => {
                            setPassword(v);
                            clearFieldError('password');
                        }}
                        error={fieldErrors.password}
                        isPassword
                        autoComplete={isSignUp ? 'new-password' : 'current-password'}
                        textContentType={isSignUp ? 'newPassword' : 'password'}
                        returnKeyType={isSignUp ? 'next' : 'done'}
                        onSubmitEditing={
                            isSignUp ? () => confirmRef.current?.focus() : handleSubmit
                        }
                    />

                    {!isSignUp && onForgotPassword && (
                        <Button
                            variant='ghost'
                            size='sm'
                            onPress={() => onForgotPassword(email.trim().toLowerCase())}
                            className='self-end px-0'
                        >
                            Forgot password?
                        </Button>
                    )}
                </View>

                {isSignUp && (
                    <FormField
                        ref={confirmRef}
                        label='Confirm Password'
                        placeholder='Repeat your password'
                        value={confirmPassword}
                        onChangeText={(v) => {
                            setConfirmPassword(v);
                            clearFieldError('confirmPassword');
                        }}
                        error={fieldErrors.confirmPassword}
                        isPassword
                        autoComplete='new-password'
                        textContentType='newPassword'
                        returnKeyType='done'
                        onSubmitEditing={handleSubmit}
                    />
                )}
            </View>

            <Button
                fullWidth
                loading={loading}
                disabled={!canSubmit}
                onPress={handleSubmit}
            >
                {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
        </View>
    );
}
