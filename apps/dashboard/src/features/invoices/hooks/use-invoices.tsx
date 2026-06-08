import type { ListInvoicesQuery } from '@/api/invoices';
import { createTeamResourceHook } from '@/hooks/use-team-resource';
import { listInvoices } from '@/api/invoices';

export const useInvoices = createTeamResourceHook<
    { invoices: Array<any>; nextToken?: string; total: number },
    ListInvoicesQuery
>('invoices', listInvoices);
