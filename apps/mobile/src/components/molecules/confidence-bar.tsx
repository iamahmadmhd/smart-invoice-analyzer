import { getConfidenceBarColor, getConfidenceColor } from '@/lib/invoice-utils';
import React from 'react';
import { View } from 'react-native';
import { ProgressBar } from '../atoms/progress-bar';
import { Text } from '../atoms/text';

export interface ConfidenceBarProps {
    score: number;
}

export function ConfidenceBar({ score }: ConfidenceBarProps) {
    return (
        <View className='gap-2'>
            <View className='flex-row items-center justify-between'>
                <Text
                    variant='caption'
                    color='tertiary'
                >
                    Extraction confidence
                </Text>
                <Text
                    variant='caption'
                    color={getConfidenceColor(score)}
                >
                    {Math.round(score * 100)}%
                </Text>
            </View>
            <ProgressBar
                value={score * 100}
                fillClassName={getConfidenceBarColor(score)}
            />
        </View>
    );
}
