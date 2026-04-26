import { useAppSelector } from '@/store';
import { Redirect, Stack } from 'expo-router';

export default function AppLayout() {
    const user = useAppSelector((state) => state.auth.user);

    if (!user) {
        return <Redirect href='/(auth)/sign-in' />;
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                //contentStyle: { backgroundColor: 'transparent' },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name='index' />
            <Stack.Screen
                name='upload'
                options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name='invoice/[id]' />
        </Stack>
    );
}
