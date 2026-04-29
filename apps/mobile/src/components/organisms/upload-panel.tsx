import React, { useRef } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { SelectedFile } from '@/store/slices/upload-slice';
import { Icon } from '../atoms/icon';
import { Text } from '../atoms/text';
import { UploadOption } from '../molecules/upload-option';

export interface UploadPanelProps {
    onFileSelected: (file: SelectedFile) => void;
    disabled?: boolean;
}

// ── Web Panel ─────────────────────────────────────────────────────────────────

function WebUploadPanel({ onFileSelected, disabled }: UploadPanelProps) {
    const inputRef = useRef<any>(null);

    const handleChange = (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            alert('Please select a PDF, JPEG, or PNG file.');
            return;
        }

        const uri = URL.createObjectURL(file);
        onFileSelected({
            uri,
            name: file.name,
            contentType: file.type as SelectedFile['contentType'],
            size: file.size,
        });
    };

    return (
        <View className='gap-4'>
            {/* Dropzone visual */}
            <Pressable
                onPress={() => inputRef.current?.click()}
                disabled={disabled}
                className='items-center gap-4 rounded-2xl border-2 border-dashed border-wire p-10 active:border-brand active:bg-brand-subtle dark:border-wire-night dark:active:bg-night-raised'
            >
                <View className='h-16 w-16 items-center justify-center rounded-2xl bg-brand-subtle dark:bg-night-raised'>
                    <Icon
                        name='upload'
                        size={28}
                        color='brand'
                    />
                </View>
                <View className='items-center gap-1.5'>
                    <Text
                        variant='body-semibold'
                        color='primary'
                    >
                        Drop your file here
                    </Text>
                    <Text
                        variant='body-small'
                        color='secondary'
                        className='text-center'
                    >
                        or tap to browse — PDF, JPEG, or PNG
                    </Text>
                </View>
            </Pressable>

            {/* Hidden file input (web only) */}
            {Platform.OS === 'web' && (
                <input
                    ref={inputRef}
                    type='file'
                    accept='application/pdf,image/jpeg,image/png'
                    style={{ display: 'none' }}
                    onChange={handleChange}
                    disabled={disabled}
                />
            )}
        </View>
    );
}

// ── Mobile Panel ──────────────────────────────────────────────────────────────

function MobileUploadPanel({ onFileSelected, disabled }: UploadPanelProps) {
    const launchCamera = async () => {
        try {
            // Dynamic import so web bundle doesn't include it
            const ImagePicker = await import('expo-image-picker');
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                alert('Camera permission is required to take a photo.');
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: 0.85,
                allowsEditing: false,
            });
            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                onFileSelected({
                    uri: asset.uri,
                    name: `photo_${Date.now()}.jpg`,
                    contentType: 'image/jpeg',
                    size: asset.fileSize ?? 0,
                });
            }
        } catch {
            alert('Camera is not available on this device.');
        }
    };

    const launchImageLibrary = async () => {
        try {
            const ImagePicker = await import('expo-image-picker');
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                alert('Photo library permission is required.');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.85,
                allowsEditing: false,
            });
            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                const ext = asset.uri.split('.').pop()?.toLowerCase();
                const contentType: SelectedFile['contentType'] =
                    ext === 'png' ? 'image/png' : 'image/jpeg';
                onFileSelected({
                    uri: asset.uri,
                    name: asset.fileName ?? `image_${Date.now()}.jpg`,
                    contentType,
                    size: asset.fileSize ?? 0,
                });
            }
        } catch {
            alert('Photo library is not available.');
        }
    };

    const launchDocumentPicker = async () => {
        try {
            const DocumentPicker = await import('expo-document-picker');
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/jpeg', 'image/png'],
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                const validTypes: SelectedFile['contentType'][] = [
                    'application/pdf',
                    'image/jpeg',
                    'image/png',
                ];
                const ct = asset.mimeType as SelectedFile['contentType'];
                if (!validTypes.includes(ct)) {
                    alert('Please select a PDF, JPEG, or PNG file.');
                    return;
                }
                onFileSelected({
                    uri: asset.uri,
                    name: asset.name,
                    contentType: ct,
                    size: asset.size ?? 0,
                });
            }
        } catch {
            alert('Document picker is not available.');
        }
    };

    return (
        <View className='overflow-hidden rounded-2xl border border-wire bg-canvas dark:border-wire-night dark:bg-night-subtle'>
            <UploadOption
                icon='camera'
                title='Take a photo'
                subtitle='Use your camera to capture the invoice'
                onPress={launchCamera}
                disabled={disabled}
            />
            <View className='mx-4 h-px bg-wire dark:bg-wire-night' />
            <UploadOption
                icon='receipt'
                title='Choose from photos'
                subtitle='Select an existing photo from your library'
                onPress={launchImageLibrary}
                disabled={disabled}
            />
            <View className='mx-4 h-px bg-wire dark:bg-wire-night' />
            <UploadOption
                icon='invoice'
                title='Browse files'
                subtitle='Pick a PDF or image from Files'
                onPress={launchDocumentPicker}
                disabled={disabled}
            />
        </View>
    );
}

// ── Platform-aware export ─────────────────────────────────────────────────────

export function UploadPanel(props: UploadPanelProps) {
    if (Platform.OS === 'web') return <WebUploadPanel {...props} />;
    return <MobileUploadPanel {...props} />;
}
