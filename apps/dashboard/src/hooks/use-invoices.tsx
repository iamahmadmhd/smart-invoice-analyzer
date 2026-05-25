import { useQuery } from '@tanstack/react-query';
import type { ListInvoicesQuery } from '@/api/invoices';
import { listInvoices } from '@/api/invoices';

export function useInvoices(teamId: string | null, query: ListInvoicesQuery = {}) {
    return useQuery({
        queryKey: ['invoices', teamId, query],
        queryFn: () => listInvoices(teamId!, query),
        enabled: !!teamId,
        staleTime: 30_000,
    });
}
