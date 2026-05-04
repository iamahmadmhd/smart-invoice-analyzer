import { Button } from '@/components/atoms/button';
import { ContainerScrollable } from '@/components/atoms/screen-container';
import { AlertBanner } from '@/components/molecules/alert-banner';
import { FilePreview } from '@/components/molecules/file-preview';
import { UploadPanel } from '@/components/organisms/upload-panel';
import { UploadProgressCard } from '@/components/organisms/upload-progress-card';
import { useUpload } from '@/hooks/use-upload';
import { SelectedFile } from '@/store/slices/upload-slice';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function UploadScreen() {
    const router = useRouter();
    const { step, file, uploadProgress, error, pickFile, startUploadFlow, resetUpload } =
        useUpload();

    const isIdle = step === 'idle';
    const isSelected = step === 'selected';
    const isActive = ['uploading', 'creating', 'processing'].includes(step);
    const isDone = step === 'done';
    const isError = step === 'error';

    const handleDone = () => {
        resetUpload();
        router.push('/(app)/invoices');
    };

    return (
        <ContainerScrollable>
            <View className='flex-1 gap-4 pt-4'>
                {/* Upload panel — shown when idle or selected */}
                {(isIdle || isSelected) && (
                    <UploadPanel
                        onFileSelected={(f: SelectedFile) => pickFile(f)}
                        disabled={isActive}
                    />
                )}

                {/* File preview */}
                {file && (isSelected || isActive || isDone || isError) && (
                    <FilePreview
                        uri={file.uri}
                        name={file.name}
                        contentType={file.contentType}
                        size={file.size}
                        onRemove={isSelected ? resetUpload : undefined}
                    />
                )}

                {/* Progress card */}
                {(isActive || isDone || isError) && (
                    <UploadProgressCard
                        step={step}
                        progress={uploadProgress}
                        error={error}
                    />
                )}

                {/* Banners */}
                {isError && error && (
                    <AlertBanner
                        variant='error'
                        title='Upload failed'
                        message={error}
                        onDismiss={resetUpload}
                    />
                )}
                {isDone && (
                    <AlertBanner
                        variant='success'
                        title='Invoice received'
                        message='Processing usually takes 30–60 seconds. Check status in Invoices.'
                    />
                )}
            </View>

            {/* Actions */}
            <View className='gap-3 pt-6'>
                {isSelected && (
                    <Button
                        fullWidth
                        size='lg'
                        onPress={startUploadFlow}
                    >
                        Upload Invoice
                    </Button>
                )}
                {isDone && (
                    <Button
                        fullWidth
                        size='lg'
                        onPress={handleDone}
                    >
                        View Invoices
                    </Button>
                )}
                {isError && (
                    <Button
                        fullWidth
                        size='lg'
                        onPress={startUploadFlow}
                    >
                        Try Again
                    </Button>
                )}
            </View>
        </ContainerScrollable>
    );
}
