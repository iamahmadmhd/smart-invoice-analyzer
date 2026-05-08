import { useAppDispatch } from '@/store';
import { updateInvoiceThunk } from '@/store/slices/invoices-slice';
import { UpdateInvoiceRequest } from '@smart-invoice-analyzer/contracts';
import { useCallback, useState } from 'react';

export function useInvoiceEdit(invoiceId: string) {
    const dispatch = useAppDispatch();
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const save = useCallback(
        async (patch: UpdateInvoiceRequest): Promise<boolean> => {
            setSaveError(null);
            setSaving(true);
            const result = await dispatch(updateInvoiceThunk({ invoiceId, patch }));
            setSaving(false);
            if (updateInvoiceThunk.fulfilled.match(result)) {
                return true;
            }
            setSaveError((result.payload as string) ?? 'Failed to save changes.');
            return false;
        },
        [dispatch, invoiceId]
    );

    const clearError = useCallback(() => setSaveError(null), []);

    return { save, saving, saveError, clearError };
}
