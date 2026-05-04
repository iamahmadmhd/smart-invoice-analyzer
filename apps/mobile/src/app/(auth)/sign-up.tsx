import { Text } from '@/components/atoms/text';
import { AuthForm } from '@/components/organisms/auth-form';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearError, signUpThunk } from '@/store/slices/auth-slice';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

export default function SignUpScreen() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { status, error } = useAppSelector((state) => state.auth);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const handleSubmit = async ({
        email,
        password,
    }: {
        email: string;
        password: string;
        confirmPassword?: string;
    }) => {
        const action = await dispatch(signUpThunk({ username: email, password }));
        if (signUpThunk.fulfilled.match(action)) {
            router.push({ pathname: '/(auth)/confirm', params: { email } });
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

                <AuthForm
                    type='signup'
                    loading={status === 'loading'}
                    error={error ?? undefined}
                    onSubmit={handleSubmit}
                    onClearError={() => dispatch(clearError())}
                />

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
