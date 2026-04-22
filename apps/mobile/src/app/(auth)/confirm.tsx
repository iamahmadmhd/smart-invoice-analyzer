import { AlertBanner, Button, Text } from '@/components';
import { OtpInput } from '@/components/atoms/otp-input';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearError, confirmSignUpThunk } from '@/store/slices/auth-slice';
import { resendSignUpCode } from 'aws-amplify/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

const OTP_LENGTH = 6;

export default function ConfirmScreen() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { status, error, pendingUsername } = useAppSelector((state) => state.auth);

    // ── Resolve the email to confirm ───────────────────────────────────────
    // Primary source: route param passed by sign-up screen.
    // Fallback: Redux pendingUsername (same session, no reload).
    // This means the confirm screen is always reachable even after a reload,
    // as long as the user navigates here with ?email=... in the URL.
    const params = useLocalSearchParams<{ email?: string }>();
    const email = params.email ?? pendingUsername ?? '';

    const [otp, setOtp] = useState('');
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const isLoading = status === 'loading';
    const displayError = error || localError;

    const handleConfirm = async () => {
        if (otp.length < OTP_LENGTH || isLoading) return;

        if (!email) {
            setLocalError('Email address is missing. Please go back and sign up again.');
            return;
        }

        setLocalError('');
        const result = await dispatch(confirmSignUpThunk({ username: email, code: otp }));

        if (confirmSignUpThunk.fulfilled.match(result)) {
            // Auto sign-in would be ideal but requires storing the password —
            // instead navigate to sign-in so the user can log straight in.
            router.replace('/(auth)/sign-in');
        }
    };

    const handleResend = async () => {
        if (isLoading) return;

        if (!email) {
            setLocalError('Email address is missing. Please go back and sign up again.');
            return;
        }

        try {
            // Call Amplify to resend the confirmation code
            await resendSignUpCode({ username: email });
            setOtp('');
            setLocalError('');
            dispatch(clearError());
        } catch (err: any) {
            setLocalError(err?.message ?? 'Failed to resend verification code');
        }
    };

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
                        Check your email
                    </Text>
                    <Text
                        variant='body'
                        color='secondary'
                        className='mt-1.5'
                    >
                        We sent a 6-digit code to{' '}
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

                {/* ── OTP input ──────────────────────────────────────────── */}
                <OtpInput
                    length={OTP_LENGTH}
                    value={otp}
                    onChange={setOtp}
                    autoFocus
                    disabled={isLoading}
                    onComplete={handleConfirm}
                />

                {/* ── CTA ────────────────────────────────────────────────── */}
                <Button
                    fullWidth
                    loading={isLoading}
                    disabled={otp.length < OTP_LENGTH}
                    onPress={handleConfirm}
                    className='mt-8'
                >
                    Verify Account
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
                            accessibilityLabel='Resend verification code'
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
