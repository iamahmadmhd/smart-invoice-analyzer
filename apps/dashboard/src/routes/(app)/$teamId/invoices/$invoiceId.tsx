import { createFileRoute } from '@tanstack/react-router';
import { InvoiceDetailPage } from '@/components/invoices/invoice-detail-page';

export const Route = createFileRoute('/(app)/$teamId/invoices/$invoiceId')({
    component: InvoiceDetailPage,
});
