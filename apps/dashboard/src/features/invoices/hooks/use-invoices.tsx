import { createTeamResourceHook } from '@/hooks/useTeamResource';
import type { ListInvoicesQuery } from '@/api/invoices';
import { listInvoices } from '@/api/invoices';

export const useInvoices = createTeamResourceHook<
    { invoices: Array<any>; nextToken?: string; total: number },
    ListInvoicesQuery
>('invoices', listInvoices);
