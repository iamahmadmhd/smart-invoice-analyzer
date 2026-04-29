import { useAppDispatch, useAppSelector } from '@/store';
import { signOutThunk } from '@/store/slices/auth-slice';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/atoms/icon';
import { ScreenContainer } from '@/components/atoms/screen-container';
import { Text } from '@/components/atoms/text';

export default function HomeScreen() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { user } = useAppSelector((state) => state.auth);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScreenContainer className='flex-1'>
                <View className='flex-row items-center justify-between px-4 pt-4 pb-3'>
                    <View>
                        <Text
                            variant='heading2'
                            color='primary'
                        >
                            Smart Invoice
                        </Text>
                        <Text
                            variant='body-small'
                            color='secondary'
                        >
                            {user?.username ?? 'Welcome back'}
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => dispatch(signOutThunk())}
                        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                        accessibilityLabel='Sign out'
                    >
                        <Icon
                            name='logout'
                            size={20}
                            color='secondary'
                        />
                    </Pressable>
                </View>

                <View className='flex-1 gap-4 px-4 pt-6'>
                    <View className='overflow-hidden rounded-2xl border border-wire bg-canvas dark:border-wire-night dark:bg-night-subtle'>
                        <Pressable
                            onPress={() => router.push('/(app)/invoices/upload')}
                            className='flex-row items-center gap-4 px-4 py-4 active:bg-canvas-inset dark:active:bg-night-inset'
                        >
                            <View className='h-10 w-10 items-center justify-center rounded-xl bg-brand'>
                                <Icon
                                    name='upload'
                                    size={18}
                                    tintColor='#fff'
                                />
                            </View>
                            <View className='flex-1'>
                                <Text
                                    variant='body-semibold'
                                    color='primary'
                                >
                                    Upload Invoice
                                </Text>
                                <Text
                                    variant='caption'
                                    color='secondary'
                                >
                                    PDF, JPEG, or PNG
                                </Text>
                            </View>
                            <Icon
                                name='forward'
                                size={16}
                                color='tertiary'
                            />
                        </Pressable>

                        <View className='mx-4 h-px bg-wire dark:bg-wire-night' />

                        <Pressable
                            onPress={() => router.push('/(app)/invoices')}
                            className='flex-row items-center gap-4 px-4 py-4 active:bg-canvas-inset dark:active:bg-night-inset'
                        >
                            <View className='h-10 w-10 items-center justify-center rounded-xl bg-canvas-inset dark:bg-night-raised'>
                                <Icon
                                    name='invoices'
                                    size={18}
                                    color='secondary'
                                />
                            </View>
                            <View className='flex-1'>
                                <Text
                                    variant='body-semibold'
                                    color='primary'
                                >
                                    View Invoices
                                </Text>
                                <Text
                                    variant='caption'
                                    color='secondary'
                                >
                                    Search and filter your invoices
                                </Text>
                            </View>
                            <Icon
                                name='forward'
                                size={16}
                                color='tertiary'
                            />
                        </Pressable>
                    </View>
                </View>
            </ScreenContainer>
        </SafeAreaView>
    );
}
