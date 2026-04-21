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
                contentStyle: { backgroundColor: '#020617' },
            }}
        />
    );
}
