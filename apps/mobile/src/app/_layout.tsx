import './global.css';
import { Spinner } from '@/components';
import { store, useAppDispatch, useAppSelector } from '@/store';
import { initAuth } from '@/store/slices/auth-slice';
import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Provider } from 'react-redux';

// Keep the splash screen visible while fonts + auth session load
SplashScreen.preventAutoHideAsync();

// ─── Auth Gate ────────────────────────────────────────────────────────────────

function AuthGate() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const segments = useSegments();
    const { user, status } = useAppSelector((state) => state.auth);

    useEffect(() => {
        dispatch(initAuth());
    }, [dispatch]);

    useEffect(() => {
        if (status === 'loading') return;

        const inAuthGroup = segments[0] === '(auth)';

        if (user && inAuthGroup) {
            router.replace('/(app)');
        } else if (!user && !inAuthGroup) {
            router.replace('/(auth)/sign-in');
        }
    }, [user, status, segments, router]);

    if (status === 'loading') {
        return (
            <View className='flex-1 items-center justify-center bg-canvas-subtle dark:bg-night'>
                <Spinner size='lg' />
            </View>
        );
    }

    return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        PlusJakartaSans_400Regular,
        PlusJakartaSans_500Medium,
        PlusJakartaSans_600SemiBold,
        PlusJakartaSans_700Bold,
    });

    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) {
        return null;
    }

    return (
        <Provider store={store}>
            <AuthGate />
        </Provider>
    );
}
