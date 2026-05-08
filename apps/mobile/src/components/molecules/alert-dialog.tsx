import { cn } from '@/lib/utils';
import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Button } from '../atoms/button';
import { Icon } from '../atoms/icon';
import { Text } from '../atoms/text';

export interface AlertDialogAction {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
    loading?: boolean;
}

export interface AlertDialogProps {
    visible: boolean;
    title: string;
    message: string;
    /** Primary/confirm action — rendered on the right */
    confirmAction?: AlertDialogAction;
    /** Cancel/dismiss action — rendered on the left */
    cancelAction?: AlertDialogAction;
    /** Icon shown above the title. Defaults to 'warning' for destructive, 'info' otherwise. */
    icon?: React.ReactNode;
    onRequestClose?: () => void;
    className?: string;
}

export function AlertDialog({
    visible,
    title,
    message,
    confirmAction,
    cancelAction,
    icon,
    onRequestClose,
    className,
}: AlertDialogProps) {
    const isDestructive = confirmAction?.variant === 'destructive';

    const defaultIcon = (
        <View
            className={cn(
                'mb-4 h-12 w-12 items-center justify-center rounded-full',
                isDestructive
                    ? 'bg-crimson-subtle dark:bg-crimson-night-subtle'
                    : 'bg-azure-subtle dark:bg-azure-night-subtle'
            )}
        >
            <Icon
                name={isDestructive ? 'warning' : 'info'}
                size={24}
                color={isDestructive ? 'error' : 'brand'}
            />
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType='fade'
            statusBarTranslucent
            onRequestClose={onRequestClose}
        >
            {/* Backdrop */}
            <Pressable
                className='absolute inset-0 flex-1 items-center justify-center bg-black/50 px-6'
                onPress={onRequestClose}
                accessibilityLabel='Dismiss dialog'
            />
            {/* Dialog card — stop propagation so tapping inside doesn't close */}
            <View className='absolute inset-0 items-center justify-center'>
                <View
                    className={cn(
                        'w-full max-w-sm rounded-2xl bg-canvas p-6 dark:bg-night-raised',
                        className
                    )}
                    accessibilityViewIsModal
                    accessibilityRole='none'
                >
                    {/* Icon */}
                    <View className='items-center'>{icon ?? defaultIcon}</View>

                    {/* Title */}
                    <Text
                        variant='heading3'
                        color='primary'
                        className='mb-2 text-center'
                    >
                        {title}
                    </Text>

                    {/* Message */}
                    <Text
                        variant='body'
                        color='secondary'
                        className='mb-6 text-center'
                    >
                        {message}
                    </Text>

                    {/* Actions */}
                    {(cancelAction || confirmAction) && (
                        <View className='flex-row gap-3'>
                            {cancelAction && (
                                <Button
                                    variant={cancelAction.variant ?? 'secondary'}
                                    size='md'
                                    onPress={cancelAction.onPress}
                                    loading={cancelAction.loading}
                                    className='flex-1'
                                >
                                    {cancelAction.label}
                                </Button>
                            )}
                            {confirmAction && (
                                <Button
                                    variant={confirmAction.variant ?? 'primary'}
                                    size='md'
                                    onPress={confirmAction.onPress}
                                    loading={confirmAction.loading}
                                    className='flex-1'
                                >
                                    {confirmAction.label}
                                </Button>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}
