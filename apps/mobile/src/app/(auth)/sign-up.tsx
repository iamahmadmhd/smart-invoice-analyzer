import { AlertBanner, Button, FormField, Text } from '@/components';
import { flattenZodErrors, SignUpFields, signUpSchema } from '@/lib/auth-schema';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearError, signUpThunk } from '@/store/slices/auth-slice';
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

export default function SignUpScreen() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { status, error } = useAppSelector((state) => state.auth);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SignUpFields, string>>>({});

    const passwordRef = useRef<TextInput>(null);
    const confirmRef = useRef<TextInput>(null);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const isLoading = status === 'loading';

    const clearFieldError = (field: keyof SignUpFields) =>
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));

    const handleSignUp = async () => {
        if (isLoading) return;

        const result = signUpSchema.safeParse({
            email: email.trim().toLowerCase(),
            password,
            confirmPassword,
        });

        if (!result.success) {
            setFieldErrors(flattenZodErrors(result.error));
            return;
        }

        setFieldErrors({});
        const action = await dispatch(
            signUpThunk({ username: result.data.email, password: result.data.password })
        );

        if (signUpThunk.fulfilled.match(action)) {
            // Pass email as a route param so the confirm screen always has it —
            // even if the app is reloaded or Redux state is cleared.
            router.push({
                pathname: '/(auth)/confirm',
                params: { email: email.trim().toLowerCase() },
            });
        }
    };

    const canSubmit = email.trim().length > 0 && password.length > 0 && confirmPassword.length > 0;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className='flex-1 bg-canvas-subtle dark:bg-night'
        >
            <ScrollView
                contentContainerClassName='grow justify-center'
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
                        Create account
                    </Text>
                    <Text
                        variant='body'
                        color='secondary'
                        className='mt-1.5'
                    >
                        Enter your details to get started
                    </Text>
                </View>

                {/* ── API error banner ───────────────────────────────────── */}
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

                    <FormField
                        ref={passwordRef}
                        label='Password'
                        placeholder='At least 8 characters'
                        value={password}
                        onChangeText={(v) => {
                            setPassword(v);
                            clearFieldError('password');
                        }}
                        error={fieldErrors.password}
                        isPassword
                        autoComplete='new-password'
                        textContentType='newPassword'
                        returnKeyType='next'
                        onSubmitEditing={() => confirmRef.current?.focus()}
                    />

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
                        onSubmitEditing={handleSignUp}
                    />
                </View>

                {/* ── CTA ────────────────────────────────────────────────── */}
                <Button
                    fullWidth
                    loading={isLoading}
                    disabled={!canSubmit}
                    onPress={handleSignUp}
                    className='mt-6'
                >
                    Create Account
                </Button>

                {/* ── Footer ─────────────────────────────────────────────── */}
                <View className='mt-6 flex-row items-center justify-center gap-1.5'>
                    <Text
                        variant='body-small'
                        color='secondary'
                    >
                        Already have an account?
                    </Text>
                    <Pressable
                        onPress={() => router.back()}
                        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                        accessibilityRole='link'
                        accessibilityLabel='Sign in'
                    >
                        <Text
                            variant='label'
                            color='brand'
                        >
                            Sign in
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
