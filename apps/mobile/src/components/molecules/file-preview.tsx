import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { FileTypeIcon } from '../atoms/file-type-icon';
import { Icon } from '../atoms/icon';
import { Text } from '../atoms/text';

export interface FilePreviewProps {
    uri: string;
    name: string;
    contentType: string;
    size?: number;
    onRemove?: () => void;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FilePreview({ uri, name, contentType, size, onRemove }: FilePreviewProps) {
    const isImage = contentType.startsWith('image/');

    return (
        <View className='flex-row items-center gap-3 rounded-xl border border-wire bg-canvas p-3 dark:border-wire-night dark:bg-night-inset'>
            {/* Thumbnail or icon */}
            <View className='h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-canvas-inset dark:bg-night-raised'>
                {isImage ? (
                    <Image
                        source={{ uri }}
                        className='h-full w-full'
                        resizeMode='cover'
                        accessibilityLabel={name}
                    />
                ) : (
                    <FileTypeIcon
                        contentType={contentType}
                        size={24}
                    />
                )}
            </View>

            {/* Info */}
            <View className='flex-1 gap-0.5'>
                <Text
                    variant='body-small'
                    color='primary'
                    numberOfLines={1}
                >
                    {name}
                </Text>
                <Text
                    variant='caption'
                    color='tertiary'
                >
                    {contentType === 'application/pdf' ? 'PDF' : 'Image'}
                    {size ? ` · ${formatSize(size)}` : ''}
                </Text>
            </View>

            {/* Remove */}
            {onRemove && (
                <Pressable
                    onPress={onRemove}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    accessibilityLabel='Remove file'
                >
                    <View className='h-7 w-7 items-center justify-center rounded-full bg-canvas-inset dark:bg-night-raised'>
                        <Icon
                            name='close'
                            size={12}
                            color='secondary'
                        />
                    </View>
                </Pressable>
            )}
        </View>
    );
}
