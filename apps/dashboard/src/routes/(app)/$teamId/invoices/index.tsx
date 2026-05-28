import { createFileRoute } from '@tanstack/react-router';
import { InvoicesPage } from '@/components/invoices/invoices-page';

export const Route = createFileRoute('/(app)/$teamId/invoices/')({
    component: InvoicesPage,
});
