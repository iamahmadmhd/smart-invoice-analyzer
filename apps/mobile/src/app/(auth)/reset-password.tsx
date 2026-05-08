import { AlertBanner, Button, FormField, Text } from '@/components';
import { OtpInput } from '@/components/atoms/otp-input';
import { flattenZodErrors, ResetPasswordFields, resetPasswordSchema } from '@/lib/auth-schema';
import { useAppDispatch, useAppSelector } from '@/store';
import {
    clearError,
    confirmResetPasswordThunk,
    forgotPasswordThunk,
} from '@/store/slices/auth-slice';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    TextInput,
    View,
} from 'react-native';

const OTP_LENGTH = 6;

export default function ResetPasswordScreen() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { status, error } = useAppSelector((state) => state.auth);

    const params = useLocalSearchParams<{ email?: string }>();
    const email = params.email ?? '';

    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState<
        Partial<Record<keyof ResetPasswordFields, string>>
    >({});
    const [localError, setLocalError] = useState('');

    const passwordRef = useRef<TextInput>(null);
    const confirmRef = useRef<TextInput>(null);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const isLoading = status === 'loading';
    const canSubmit =
        otp.length === OTP_LENGTH && password.length > 0 && confirmPassword.length > 0;
    const displayError = error || localError;

    const clearFieldError = (field: keyof ResetPasswordFields) =>
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));

    const handleResend = async () => {
        if (isLoading || !email) return;
        setLocalError('');
        dispatch(clearError());
        setOtp('');
        await dispatch(forgotPasswordThunk({ username: email }));
    };

    const handleSubmit = async () => {
        if (!canSubmit || isLoading) return;

        if (!email) {
            setLocalError('Email address is missing. Please go back and try again.');
            return;
        }

        const result = resetPasswordSchema.safeParse({ code: otp, password, confirmPassword });

        if (!result.success) {
            setFieldErrors(flattenZodErrors(result.error));
            return;
        }

        setFieldErrors({});
        setLocalError('');

        const action = await dispatch(
            confirmResetPasswordThunk({
                username: email,
                code: otp,
                newPassword: result.data.password,
            })
        );

        if (confirmResetPasswordThunk.fulfilled.match(action)) {
            router.replace('/(auth)/sign-in');
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
                        New password
                    </Text>
                    <Text
                        variant='body'
                        color='secondary'
                        className='mt-1.5'
                    >
                        Enter the 6-digit code sent to{' '}
                        <Text
                            variant='body-semibold'
                            color='primary'
                        >
                            {email || 'your email'}
                        </Text>
                    </Text>
                </View>

                {/* ── Error banner ───────────────────────────────────────── */}
                {displayError && (
                    <AlertBanner
                        variant='error'
                        message={displayError}
                        onDismiss={() => {
                            dispatch(clearError());
                            setLocalError('');
                        }}
                        className='mb-6'
                    />
                )}

                {/* ── OTP ────────────────────────────────────────────────── */}
                <OtpInput
                    length={OTP_LENGTH}
                    value={otp}
                    onChange={setOtp}
                    autoFocus
                    disabled={isLoading}
                    onComplete={() => passwordRef.current?.focus()}
                />

                {/* ── Password fields ────────────────────────────────────── */}
                <View className='mt-6 gap-4'>
                    <FormField
                        ref={passwordRef}
                        label='New Password'
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
                        onSubmitEditing={handleSubmit}
                    />
                </View>

                {/* ── CTA ────────────────────────────────────────────────── */}
                <Button
                    fullWidth
                    loading={isLoading}
                    disabled={!canSubmit}
                    onPress={handleSubmit}
                    className='mt-6'
                >
                    Reset Password
                </Button>

                {/* ── Resend + Back ──────────────────────────────────────── */}
                <View className='mt-6 items-center gap-3'>
                    <View className='flex-row items-center gap-1.5'>
                        <Text
                            variant='body-small'
                            color='secondary'
                        >
                            Didn&apos;t receive it?
                        </Text>
                        <Pressable
                            onPress={handleResend}
                            disabled={isLoading}
                            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                            accessibilityRole='button'
                            accessibilityLabel='Resend reset code'
                        >
                            <Text
                                variant='label'
                                color='brand'
                            >
                                Resend code
                            </Text>
                        </Pressable>
                    </View>

                    <Pressable
                        onPress={() => router.replace('/(auth)/sign-in')}
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
