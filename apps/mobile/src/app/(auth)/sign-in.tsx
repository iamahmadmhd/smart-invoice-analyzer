import { Text } from '@/components/atoms/text';
import { AuthForm } from '@/components/organisms/auth-form';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearError, signInThunk } from '@/store/slices/auth-slice';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

export default function SignInScreen() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { status, error } = useAppSelector((state) => state.auth);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const handleSubmit = async ({ email, password }: { email: string; password: string }) => {
        await dispatch(signInThunk({ username: email, password }));
    };

    const handleForgotPassword = (email: string) => {
        router.push({ pathname: '/(auth)/forgot-password', params: { email } });
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

                <AuthForm
                    type='signin'
                    loading={status === 'loading'}
                    error={error ?? undefined}
                    onSubmit={handleSubmit}
                    onClearError={() => dispatch(clearError())}
                    onForgotPassword={handleForgotPassword}
                />

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
