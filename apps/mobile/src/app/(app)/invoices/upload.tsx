import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUpload } from '@/hooks/use-upload';
import { SelectedFile } from '@/store/slices/upload-slice';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { Text } from '@/components/atoms/text';
import { ScreenContainer } from '@/components/atoms/screen-container';
import { AlertBanner } from '@/components/molecules/alert-banner';
import { FilePreview } from '@/components/molecules/file-preview';
import { UploadPanel } from '@/components/organisms/upload-panel';
import { UploadProgressCard } from '@/components/organisms/upload-progress-card';

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
        <SafeAreaView style={{ flex: 1 }}>
            <ScreenContainer
                scrollable
                className='flex-1'
            >
                <ScrollView
                    contentContainerClassName='grow px-4 pb-8'
                    keyboardShouldPersistTaps='handled'
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View className='flex-row items-center gap-3 pt-4 pb-6'>
                        <View className='flex-1'>
                            <Text
                                variant='heading2'
                                color='primary'
                            >
                                Upload Invoice
                            </Text>
                            <Text
                                variant='body-small'
                                color='secondary'
                                className='mt-0.5'
                            >
                                PDF, JPEG, or PNG · up to 10 MB
                            </Text>
                        </View>
                        {(isDone || isError) && (
                            <Pressable
                                onPress={resetUpload}
                                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                            >
                                <Icon
                                    name='refresh'
                                    size={20}
                                    color='secondary'
                                />
                            </Pressable>
                        )}
                    </View>

                    <View className='flex-1 gap-4'>
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
                        {(isIdle || isSelected) && (
                            <Button
                                fullWidth
                                size='md'
                                variant='ghost'
                                onPress={() => router.back()}
                            >
                                Cancel
                            </Button>
                        )}
                    </View>
                </ScrollView>
            </ScreenContainer>
        </SafeAreaView>
    );
}
