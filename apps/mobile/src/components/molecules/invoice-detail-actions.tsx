import { useAppDispatch } from '@/store';
import { deleteInvoiceThunk } from '@/store/slices/invoices-slice';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { Icon } from '../atoms/icon';
import { AlertDialog } from './alert-dialog';

export interface InvoiceDetailActionsProps {
    invoiceId?: string;
}

export function InvoiceDetailActions({ invoiceId }: InvoiceDetailActionsProps) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleConfirmDelete = async () => {
        if (!invoiceId) return;
        setDeleting(true);
        const result = await dispatch(deleteInvoiceThunk(invoiceId));
        setDeleting(false);
        if (deleteInvoiceThunk.fulfilled.match(result)) {
            setConfirmVisible(false);
            router.dismissTo('/(app)/invoices');
        } else {
            setConfirmVisible(false);
            setErrorMessage((result.payload as string) ?? 'Something went wrong.');
        }
    };

    return (
        <>
            <AlertDialog
                visible={confirmVisible}
                title='Delete invoice'
                message='This will permanently delete the invoice and all related data. This action cannot be undone.'
                cancelAction={{
                    label: 'Cancel',
                    variant: 'primary',
                    onPress: () => setConfirmVisible(false),
                }}
                confirmAction={{
                    label: 'Delete',
                    variant: 'destructive',
                    onPress: handleConfirmDelete,
                    loading: deleting,
                }}
                onRequestClose={() => setConfirmVisible(false)}
            />
            <AlertDialog
                visible={errorMessage !== null}
                title='Delete failed'
                message={errorMessage ?? ''}
                confirmAction={{ label: 'OK', onPress: () => setErrorMessage(null) }}
                onRequestClose={() => setErrorMessage(null)}
            />
            <Pressable
                onPress={() => router.push(`/(app)/invoices/edit?id=${invoiceId}`)}
                hitSlop={{ top: 8, right: 4, bottom: 8, left: 8 }}
                accessibilityLabel='Edit invoice'
                className='mr-1'
            >
                <Icon
                    name='edit'
                    size={20}
                    color='secondary'
                />
            </Pressable>
            <Pressable
                onPress={() => setConfirmVisible(true)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 4 }}
                accessibilityLabel='Delete invoice'
            >
                <Icon
                    name='trash'
                    size={20}
                    color='error'
                />
            </Pressable>
        </>
    );
}
