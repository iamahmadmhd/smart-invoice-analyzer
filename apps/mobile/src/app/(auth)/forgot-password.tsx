import { AlertBanner, Button, FormField, Text } from '@/components';
import { flattenZodErrors, ForgotPasswordFields, forgotPasswordSchema } from '@/lib/auth-schema';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearError, forgotPasswordThunk } from '@/store/slices/auth-slice';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

export default function ForgotPasswordScreen() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { status, error } = useAppSelector((state) => state.auth);

    const [email, setEmail] = useState('');
    const [fieldErrors, setFieldErrors] = useState<
        Partial<Record<keyof ForgotPasswordFields, string>>
    >({});

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const isLoading = status === 'loading';
    const canSubmit = email.trim().length > 0;

    const handleSubmit = async () => {
        if (isLoading) return;

        const result = forgotPasswordSchema.safeParse({ email: email.trim().toLowerCase() });

        if (!result.success) {
            setFieldErrors(flattenZodErrors(result.error));
            return;
        }

        setFieldErrors({});
        const action = await dispatch(forgotPasswordThunk({ username: result.data.email }));

        if (forgotPasswordThunk.fulfilled.match(action)) {
            router.push({
                pathname: '/(auth)/reset-password',
                params: { email: result.data.email },
            });
        }
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
                        Reset password
                    </Text>
                    <Text
                        variant='body'
                        color='secondary'
                        className='mt-1.5'
                    >
                        Enter your email and we&apos;ll send you a reset code
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
                <FormField
                    label='Email'
                    placeholder='you@example.com'
                    value={email}
                    onChangeText={(v) => {
                        setEmail(v);
                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    error={fieldErrors.email}
                    keyboardType='email-address'
                    autoCapitalize='none'
                    autoCorrect={false}
                    autoComplete='email'
                    textContentType='emailAddress'
                    returnKeyType='done'
                    onSubmitEditing={handleSubmit}
                />

                {/* ── CTA ────────────────────────────────────────────────── */}
                <Button
                    fullWidth
                    loading={isLoading}
                    disabled={!canSubmit}
                    onPress={handleSubmit}
                    className='mt-6'
                >
                    Send Reset Code
                </Button>

                {/* ── Back ───────────────────────────────────────────────── */}
                <View className='mt-6 items-center'>
                    <Pressable
                        onPress={() => router.back()}
                        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                        accessibilityRole='link'
                    >
                        <Text
                            variant='body-small'
                            color='tertiary'
                        >
                            Back to sign in
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
