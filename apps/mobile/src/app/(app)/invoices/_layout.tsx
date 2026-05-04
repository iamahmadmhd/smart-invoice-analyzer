import { Icon } from '@/components/atoms/icon';
import { Text } from '@/components/atoms/text';
import { Stack, useRouter } from 'expo-router';
import { Pressable, useColorScheme } from 'react-native';
import { useResolveClassNames } from 'uniwind';

export default function InvoicesLayout() {
    const scheme = useColorScheme();
    const router = useRouter();

    const dark = scheme === 'dark';
    const classNames = useResolveClassNames(dark ? 'bg-night' : 'bg-canvas-subtle');

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { ...classNames },
            }}
        >
            <Stack.Screen
                name='index'
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: classNames.backgroundColor as string },
                    headerShadowVisible: false,
                    headerTitle: () => (
                        <Text
                            variant='heading2'
                            color='primary'
                        >
                            Invoices
                        </Text>
                    ),
                    headerRight: () => (
                        <Pressable onPress={() => router.push('/(app)/invoices/upload')}>
                            <Icon
                                name='plus'
                                size={20}
                            />
                        </Pressable>
                    ),
                }}
            />
            <Stack.Screen
                name='upload'
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: classNames.backgroundColor as string },
                    headerShadowVisible: false,
                    headerTitle: () => (
                        <Text
                            variant='heading2'
                            color='primary'
                        >
                            Upload Invoice
                        </Text>
                    ),
                    headerLeft: () => (
                        <Pressable
                            onPress={() => router.back()}
                            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                        >
                            <Icon
                                name='back'
                                size={20}
                            />
                        </Pressable>
                    ),
                }}
            />
            <Stack.Screen
                name='[id]'
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: classNames.backgroundColor as string },
                    headerShadowVisible: false,
                    headerTitle: () => (
                        <Text
                            variant='heading2'
                            color='primary'
                        >
                            Invoice Details
                        </Text>
                    ),
                    headerLeft: () => (
                        <Pressable
                            onPress={() => router.back()}
                            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                        >
                            <Icon
                                name='back'
                                size={20}
                            />
                        </Pressable>
                    ),
                }}
            />
        </Stack>
    );
}
