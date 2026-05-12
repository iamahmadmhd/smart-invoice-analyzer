import { UploadStep } from '@/store/slices/upload-slice';
import React from 'react';
import { View } from 'react-native';
import { Icon } from '../atoms/icon';
import { ProgressBar } from '../atoms/progress-bar';
import { Spinner } from '../atoms/spinner';
import { Text } from '../atoms/text';

interface StepInfo {
    label: string;
    sublabel: string;
}

const STEP_INFO: Record<UploadStep, StepInfo> = {
    idle: { label: '', sublabel: '' },
    selected: { label: 'Ready to upload', sublabel: 'Tap the button to start' },
    uploading: { label: 'Uploading…', sublabel: 'Sending file to server' },
    creating: { label: 'Creating invoice…', sublabel: 'Registering in the system' },
    processing: { label: 'Processing…', sublabel: 'OCR and AI extraction running' },
    done: { label: 'Processing…', sublabel: 'OCR and AI extraction running' },
    error: { label: 'Processing…', sublabel: 'OCR and AI extraction running' },
};

export interface UploadProgressCardProps {
    step: UploadStep;
    progress: number;
}

export function UploadProgressCard({ step, progress }: UploadProgressCardProps) {
    const info = STEP_INFO[step];
    const isActive = ['uploading', 'creating', 'processing', 'done', 'error'].includes(step);

    return (
        <View className='gap-3 rounded-xl border border-wire bg-canvas p-4 dark:border-wire-night dark:bg-night-subtle'>
            {/* Status icon + label */}
            <View className='flex-row items-center gap-3'>
                <View className='h-9 w-9 items-center justify-center rounded-xl bg-brand-subtle dark:bg-night-raised'>
                    {isActive ? (
                        <Spinner
                            size='sm'
                            color='brand'
                        />
                    ) : (
                        <Icon
                            name='upload'
                            size={18}
                            color='brand'
                        />
                    )}
                </View>
                <View className='flex-1'>
                    <Text
                        variant='body-semibold'
                        color='primary'
                    >
                        {info.label}
                    </Text>
                    <Text
                        variant='caption'
                        color='tertiary'
                    >
                        {info.sublabel}
                    </Text>
                </View>
                {isActive && (
                    <Text
                        variant='caption'
                        color='brand'
                    >
                        {progress}%
                    </Text>
                )}
            </View>

            {/* Progress bar */}
            {isActive && <ProgressBar value={progress} />}
        </View>
    );
}
