import React from 'react';
import { View } from 'react-native';

export interface SectionCardProps {
    children: React.ReactNode;
}

export function SectionCard({ children }: SectionCardProps) {
    return (
        <View className='rounded-2xl border border-wire bg-canvas px-4 dark:border-wire-night dark:bg-night-subtle'>
            {children}
        </View>
    );
}
