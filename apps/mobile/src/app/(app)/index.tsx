import { useAppDispatch, useAppSelector } from '@/store';
import { signOutThunk } from '@/store/slices/auth-slice';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

export default function Dashboard() {
    const dispatch = useAppDispatch();
    const { user, status } = useAppSelector((state) => state.auth);

    const handleSignOut = () => dispatch(signOutThunk());

    return (
        <View className='flex-1 items-center justify-center bg-slate-950 px-6'>
            <Text className='text-2xl font-bold text-white'>Dashboard</Text>
            <Text className='mt-2 text-sm text-slate-400'>Signed in as {user?.username}</Text>

            <Pressable
                onPress={handleSignOut}
                className='mt-8 rounded-xl border border-slate-700 px-6 py-3 active:opacity-70'
            >
                {status === 'loading' ? (
                    <ActivityIndicator color='#94a3b8' />
                ) : (
                    <Text className='text-sm font-medium text-slate-300'>Sign Out</Text>
                )}
            </Pressable>
        </View>
    );
}
