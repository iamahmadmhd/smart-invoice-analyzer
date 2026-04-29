import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useResolveClassNames } from 'uniwind';

export default function InvoicesLayout() {
    const scheme = useColorScheme();

    const dark = scheme === 'dark';
    const backgroundColor = useResolveClassNames(dark ? 'bg-night' : 'bg-canvas-subtle');

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { ...backgroundColor },
            }}
        />
    );
}
