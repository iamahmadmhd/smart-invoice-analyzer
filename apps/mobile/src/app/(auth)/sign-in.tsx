import { AlertBanner, Button, FormField, Text } from '@/components';
import { flattenZodErrors, SignInFields, signInSchema } from '@/lib/auth-schema';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearError, signInThunk } from '@/store/slices/auth-slice';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    TextInput,
    View,
} from 'react-native';

export default function SignInScreen() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { status, error } = useAppSelector((state) => state.auth);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SignInFields, string>>>({});

    const passwordRef = useRef<TextInput>(null);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const isLoading = status === 'loading';
    const canSubmit = email.trim().length > 0 && password.length > 0;

    const clearFieldError = (field: keyof SignInFields) =>
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));

    const handleSignIn = async () => {
        if (isLoading) return;

        const result = signInSchema.safeParse({ email: email.trim().toLowerCase(), password });

        if (!result.success) {
            setFieldErrors(flattenZodErrors(result.error));
            return;
        }

        setFieldErrors({});
        await dispatch(
            signInThunk({ username: result.data.email, password: result.data.password })
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className='flex-1 bg-canvas-subtle dark:bg-night'
        >
            <ScrollView
                contentContainerClassName='grow justify-center max-w-lg mx-auto w-full'
                className='px-6'
                keyboardShouldPersistTaps='handled'
                showsVerticalScrollIndicator={false}
            >
                {/* ── Header ─────────────────────────────────────────────── */}
                <View className='mb-8'>
                    <Text
                        variant='heading1'
                        color='primary'
                    >
                        Welcome back
                    </Text>
                    <Text
                        variant='body'
                        color='secondary'
                        className='mt-1.5'
                    >
                        Sign in to your account to continue
                    </Text>
                </View>

                {/* ── Error banner ───────────────────────────────────────── */}
                {error && (
                    <AlertBanner
                        variant='error'
                        message={error}
                        onDismiss={() => dispatch(clearError())}
                        className='mb-6'
                    />
                )}

                {/* ── Form ───────────────────────────────────────────────── */}
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
                            placeholder='Enter your password'
                            value={password}
                            onChangeText={(v) => {
                                setPassword(v);
                                clearFieldError('password');
                            }}
                            error={fieldErrors.password}
                            isPassword
                            autoComplete='current-password'
                            textContentType='password'
                            returnKeyType='done'
                            onSubmitEditing={handleSignIn}
                        />

                        {/* ── Forgot password link ──────────────────────── */}
                        <Pressable
                            onPress={() =>
                                router.push({
                                    pathname: '/(auth)/forgot-password',
                                    params: { email: email.trim().toLowerCase() },
                                })
                            }
                            hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
                            accessibilityRole='link'
                            className='self-end'
                        >
                            <Text
                                variant='caption'
                                color='brand'
                            >
                                Forgot password?
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* ── CTA ────────────────────────────────────────────────── */}
                <Button
                    fullWidth
                    loading={isLoading}
                    disabled={!canSubmit}
                    onPress={handleSignIn}
                    className='mt-6'
                >
                    Sign In
                </Button>

                {/* ── Footer ─────────────────────────────────────────────── */}
                <View className='mt-6 flex-row items-center justify-center gap-1.5'>
                    <Text
                        variant='body-small'
                        color='secondary'
                    >
                        Don&apos;t have an account?
                    </Text>
                    <Pressable
                        onPress={() => router.push('/(auth)/sign-up')}
                        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                        accessibilityRole='link'
                        accessibilityLabel='Create an account'
                    >
                        <Text
                            variant='label'
                            color='brand'
                        >
                            Sign up
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
