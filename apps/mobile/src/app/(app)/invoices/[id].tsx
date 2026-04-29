import React from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/atoms/text';
import { Icon } from '@/components/atoms/icon';
import { ScreenContainer } from '@/components/atoms/screen-container';
import { EmptyState } from '@/components/molecules/empty-state';

export default function InvoiceDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScreenContainer className='flex-1'>
                <View className='flex-row items-center gap-3 px-4 pt-4 pb-3'>
                    <Pressable
                        onPress={() => router.back()}
                        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                        accessibilityLabel='Go back'
                    >
                        <Icon
                            name='back'
                            size={20}
                            color='primary'
                        />
                    </Pressable>
                    <Text
                        variant='heading4'
                        color='primary'
                    >
                        Invoice Detail
                    </Text>
                </View>

                <EmptyState
                    icon='invoice'
                    title='Detail view coming soon'
                    body={`Invoice ID: ${id}`}
                    action={{ label: 'Go back', onPress: () => router.back() }}
                />
            </ScreenContainer>
        </SafeAreaView>
    );
}
