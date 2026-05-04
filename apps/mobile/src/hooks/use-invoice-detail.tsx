import { getInsights, getInvoice } from '@/lib/api/invoices';
import { Insight, Invoice } from '@smart-invoice-analyzer/contracts';
import { useCallback, useEffect, useState } from 'react';

interface InvoiceDetailState {
    invoice: Invoice | null;
    insights: Insight[];
    loading: boolean;
    error: string | null;
}

export function useInvoiceDetail(invoiceId: string) {
    const [state, setState] = useState<InvoiceDetailState>({
        invoice: null,
        insights: [],
        loading: true,
        error: null,
    });

    const fetch = useCallback(async () => {
        if (!invoiceId) return;
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const [invoice, insights] = await Promise.all([
                getInvoice(invoiceId),
                getInsights(invoiceId).catch(() => []), // insights are non-critical
            ]);
            setState({ invoice, insights, loading: false, error: null });
        } catch (e: any) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: e?.message ?? 'Failed to load invoice',
            }));
        }
    }, [invoiceId]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { ...state, refresh: fetch };
}
