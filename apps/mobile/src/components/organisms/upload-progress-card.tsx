import React from 'react';
import { View } from 'react-native';
import { UploadStep } from '@/store/slices/upload-slice';
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
    done: { label: 'Done!', sublabel: 'Invoice is being processed' },
    error: { label: 'Upload failed', sublabel: 'Something went wrong' },
};

export interface UploadProgressCardProps {
    step: UploadStep;
    progress: number;
    error?: string | null;
}

export function UploadProgressCard({ step, progress, error }: UploadProgressCardProps) {
    const info = STEP_INFO[step];
    const isError = step === 'error';
    const isDone = step === 'done';
    const isActive = ['uploading', 'creating', 'processing'].includes(step);

    return (
        <View className='gap-3 rounded-xl border border-wire bg-canvas p-4 dark:border-wire-night dark:bg-night-subtle'>
            {/* Status icon + label */}
            <View className='flex-row items-center gap-3'>
                <View
                    className={`h-9 w-9 items-center justify-center rounded-xl ${
                        isDone
                            ? 'bg-jade-subtle dark:bg-jade-night-subtle'
                            : isError
                              ? 'bg-crimson-subtle dark:bg-crimson-night-subtle'
                              : 'bg-brand-subtle dark:bg-night-raised'
                    }`}
                >
                    {isActive && (
                        <Spinner
                            size='sm'
                            color='brand'
                        />
                    )}
                    {isDone && (
                        <Icon
                            name='success'
                            size={18}
                            color='success'
                        />
                    )}
                    {isError && (
                        <Icon
                            name='error'
                            size={18}
                            color='error'
                        />
                    )}
                    {!isActive && !isDone && !isError && (
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
                        color={isError ? 'error' : 'primary'}
                    >
                        {info.label}
                    </Text>
                    <Text
                        variant='caption'
                        color='tertiary'
                    >
                        {isError && error ? error : info.sublabel}
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
            {(isActive || isDone) && (
                <ProgressBar
                    value={isDone ? 100 : progress}
                    fillClassName={isDone ? 'bg-jade' : undefined}
                />
            )}
        </View>
    );
}
