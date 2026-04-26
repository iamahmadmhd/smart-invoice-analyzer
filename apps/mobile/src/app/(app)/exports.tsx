import { useAppSelector } from '@/store';
import React from 'react';
import { Text, View } from 'react-native';

export default function ExportsScreen() {
    const { user } = useAppSelector((state) => state.auth);

    return (
        <View className='flex-1 items-center justify-center bg-slate-950 px-6'>
            <Text className='text-2xl font-bold text-white'>Exports</Text>
            <Text className='mt-2 text-sm text-slate-400'>Signed in as {user?.username}</Text>
        </View>
    );
}
