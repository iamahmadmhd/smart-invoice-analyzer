import { useAppDispatch } from '@/store';
import { deleteInvoiceThunk } from '@/store/slices/invoices-slice';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

export function useInvoiceDelete(invoiceId: string | undefined) {
    const dispatch = useAppDispatch();
    const router = useRouter();

    return useCallback(() => {
        if (!invoiceId) return;
        Alert.alert(
            'Delete invoice',
            'This will permanently delete the invoice and all related data. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await dispatch(deleteInvoiceThunk(invoiceId));
                        if (deleteInvoiceThunk.fulfilled.match(result)) {
                            router.dismissTo('/(app)/invoices');
                        } else {
                            Alert.alert(
                                'Delete failed',
                                (result.payload as string) ?? 'Something went wrong.'
                            );
                        }
                    },
                },
            ]
        );
    }, [dispatch, invoiceId, router]);
}
