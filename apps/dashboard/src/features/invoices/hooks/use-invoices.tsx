import type { Invoice, ListInvoicesQuery } from '@/api/invoices';
import { createTeamResourceHook } from '@/hooks/use-team-resource';
import { listInvoices } from '@/api/invoices';

export const useInvoices = createTeamResourceHook<
    { invoices: Array<Invoice>; nextToken?: string; total: number },
    ListInvoicesQuery
>('invoices', listInvoices);
