import { useInvoiceDelete } from '@/hooks/use-invoice-delete';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';
import { Icon } from '../atoms/icon';

export interface InvoiceDetailActionsProps {
    invoiceId?: string;
}

export function InvoiceDetailActions({ invoiceId }: InvoiceDetailActionsProps) {
    const router = useRouter();
    const handleDelete = useInvoiceDelete(invoiceId);

    return (
        <>
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
                onPress={handleDelete}
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
