import { createFileRoute } from '@tanstack/react-router';
import { InvoiceDetail } from '@/features/invoices';

export const Route = createFileRoute('/(app)/$teamId/invoices/$invoiceId')({
    component: InvoiceDetail,
});
