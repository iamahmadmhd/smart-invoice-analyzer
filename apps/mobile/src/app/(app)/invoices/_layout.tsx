import { Icon } from '@/components/atoms/icon';
import { StackHeader } from '@/components/molecules/stack-header';
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
                contentStyle: { ...classNames },
            }}
        >
            <Stack.Screen
                name='index'
                options={{
                    header: () => (
                        <StackHeader
                            title='Invoices'
                            right={
                                <Pressable
                                    onPress={() => router.push('/(app)/invoices/upload')}
                                    className='size-8 items-center justify-center rounded-xl bg-brand active:opacity-80'
                                    accessibilityLabel='Upload invoice'
                                >
                                    <Icon
                                        name='plus'
                                        size={18}
                                    />
                                </Pressable>
                            }
                        />
                    ),
                }}
            />
            <Stack.Screen
                name='upload'
                options={{
                    header: () => (
                        <StackHeader
                            title='Upload Invoice'
                            left={
                                <Pressable
                                    onPress={() => router.back()}
                                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                                >
                                    <Icon
                                        name='back'
                                        size={20}
                                    />
                                </Pressable>
                            }
                        />
                    ),
                }}
            />
            <Stack.Screen
                name='[id]'
                options={{
                    header: () => (
                        <StackHeader
                            title='Invoice Details'
                            left={
                                <Pressable
                                    onPress={() => router.back()}
                                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                                >
                                    <Icon
                                        name='back'
                                        size={20}
                                    />
                                </Pressable>
                            }
                        />
                    ),
                }}
            />
        </Stack>
    );
}
