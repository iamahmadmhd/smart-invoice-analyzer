import { AlertBanner, Icon, Spinner, Text } from '@/components';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearUploadState, uploadInvoice } from '@/store/slices/invoice-slice';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Option tile ───────────────────────────────────────────────────────────────

function OptionTile({
    icon,
    title,
    description,
    onPress,
    disabled,
}: {
    icon: string;
    title: string;
    description: string;
    onPress: () => void;
    disabled?: boolean;
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            className='flex-row items-center gap-4 rounded-2xl border border-wire bg-canvas p-4 active:opacity-60 dark:border-wire-night dark:bg-night-inset'
            style={{ opacity: disabled ? 0.4 : 1 }}
        >
            <View className='h-14 w-14 items-center justify-center rounded-xl bg-brand-subtle dark:bg-night-raised'>
                <Icon
                    name={icon as any}
                    size={26}
                    color='brand'
                />
            </View>
            <View className='flex-1'>
                <Text
                    variant='body-semibold'
                    color='primary'
                >
                    {title}
                </Text>
                <Text
                    variant='body-small'
                    color='tertiary'
                    className='mt-0.5'
                >
                    {description}
                </Text>
            </View>
            <Icon
                name='forward'
                size={16}
                color='tertiary'
            />
        </Pressable>
    );
}

// ── Processing overlay ────────────────────────────────────────────────────────

function UploadingOverlay({ status }: { status: string }) {
    const label =
        status === 'uploading'
            ? 'Uploading file...'
            : status === 'creating'
              ? 'Creating invoice...'
              : 'Processing...';

    return (
        <View className='absolute inset-0 z-50 items-center justify-center rounded-3xl bg-canvas/90 dark:bg-night/90'>
            <Spinner
                size='lg'
                color='brand'
            />
            <Text
                variant='body-semibold'
                color='primary'
                className='mt-4'
            >
                {label}
            </Text>
            <Text
                variant='body-small'
                color='tertiary'
                className='mt-1'
            >
                This may take a moment
            </Text>
        </View>
    );
}

// ── Upload screen ─────────────────────────────────────────────────────────────

const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
type AcceptedMime = (typeof ACCEPTED_MIME_TYPES)[number];

function mimeFromExtension(ext: string): AcceptedMime {
    switch (ext.toLowerCase()) {
        case 'pdf':
            return 'application/pdf';
        case 'png':
            return 'image/png';
        default:
            return 'image/jpeg';
    }
}

export default function UploadScreen() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { uploadStatus, uploadError, lastCreatedInvoiceId } = useAppSelector((s) => s.invoices);

    const isUploading = uploadStatus === 'uploading' || uploadStatus === 'creating';

    // Navigate to invoice detail after successful upload
    useEffect(() => {
        if (uploadStatus === 'succeeded' && lastCreatedInvoiceId) {
            const id = lastCreatedInvoiceId;
            dispatch(clearUploadState());
            router.replace({
                pathname: '/(app)/invoice/[id]',
                params: { id },
            });
        }
    }, [uploadStatus, lastCreatedInvoiceId]);

    const handlePickResult = async (result: ImagePicker.ImagePickerResult) => {
        if (result.canceled || !result.assets.length) return;

        const asset = result.assets[0];
        const uri = asset.uri;
        const fileName = asset.fileName ?? `invoice_${Date.now()}.jpg`;
        const ext = fileName.split('.').pop() ?? 'jpg';
        const contentType = (asset.mimeType as AcceptedMime) ?? mimeFromExtension(ext);

        // Fetch the file as a blob for upload
        const response = await fetch(uri);
        const blob = await response.blob();

        dispatch(uploadInvoice({ file: blob, fileName, contentType }));
    };

    const handleCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Camera access needed',
                'Please allow camera access in your device settings to take photos of invoices.'
            );
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.9,
            allowsEditing: false,
        });

        await handlePickResult(result);
    };

    const handleFilePicker = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.9,
            allowsEditing: false,
        });

        await handlePickResult(result);
    };

    return (
        <SafeAreaView className='flex-1 bg-canvas-subtle dark:bg-night'>
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <View className='flex-row items-center px-4 py-3'>
                <Pressable
                    onPress={() => router.back()}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    className='mr-3'
                >
                    <Icon
                        name='back'
                        size={20}
                        color='primary'
                    />
                </Pressable>
                <Text
                    variant='heading3'
                    color='primary'
                >
                    Add Invoice
                </Text>
            </View>

            <View className='flex-1 px-4'>
                {/* ── Error ──────────────────────────────────────────────────── */}
                {uploadError && (
                    <AlertBanner
                        variant='error'
                        message={uploadError}
                        className='mb-4'
                    />
                )}

                {/* ── Illustration ────────────────────────────────────────────── */}
                <View className='items-center py-10'>
                    <View className='mb-4 h-24 w-24 items-center justify-center rounded-3xl bg-brand-subtle dark:bg-night-raised'>
                        <Icon
                            name='upload'
                            size={40}
                            color='brand'
                        />
                    </View>
                    <Text
                        variant='heading3'
                        color='primary'
                        className='text-center'
                    >
                        Upload an invoice
                    </Text>
                    <Text
                        variant='body'
                        color='secondary'
                        className='mt-2 max-w-xs text-center'
                    >
                        Take a photo or choose a file. We&apos;ll extract and analyze it
                        automatically.
                    </Text>
                </View>

                {/* ── Options ─────────────────────────────────────────────────── */}
                <View className='relative gap-3'>
                    {isUploading && <UploadingOverlay status={uploadStatus} />}

                    <OptionTile
                        icon='camera'
                        title='Take a photo'
                        description='Photograph your invoice or receipt'
                        onPress={handleCamera}
                        disabled={isUploading}
                    />

                    <OptionTile
                        icon='upload'
                        title='Choose from library'
                        description='Select a PDF, JPG, or PNG file'
                        onPress={handleFilePicker}
                        disabled={isUploading}
                    />
                </View>

                {/* ── Supported formats ────────────────────────────────────────── */}
                <View className='mt-8 flex-row items-center justify-center gap-4'>
                    {['PDF', 'JPG', 'PNG'].map((fmt) => (
                        <View
                            key={fmt}
                            className='rounded-lg bg-canvas-inset px-3 py-1 dark:bg-night-raised'
                        >
                            <Text
                                variant='caption'
                                color='tertiary'
                            >
                                {fmt}
                            </Text>
                        </View>
                    ))}
                </View>
                <Text
                    variant='caption'
                    color='tertiary'
                    className='mt-2 text-center'
                >
                    Supported formats · Max 10 MB
                </Text>
            </View>
        </SafeAreaView>
    );
}
