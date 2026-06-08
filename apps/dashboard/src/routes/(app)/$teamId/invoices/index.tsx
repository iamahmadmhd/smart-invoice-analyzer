import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import type { Invoice } from '@/api/invoices';
import {
    InvoiceDataTable,
    InvoiceEmptyListing,
    InvoiceTableSkeleton,
    UploadDialog,
    invoiceColumns,
    useInvoices,
} from '@/features/invoices';
import { ErrorState } from '@/components/common';

export const Route = createFileRoute('/(app)/$teamId/invoices/')({
    component: InvoicesList,
});

export function InvoicesList() {
    const { teamId } = useParams({ from: '/(app)/$teamId/invoices/' });
    const navigate = useNavigate();

    const { data, isLoading, isError } = useInvoices(teamId, {});

    const invoices: Array<Invoice> = data?.invoices ?? [];

    const handleRowClick = (invoice: Invoice) => {
        navigate({
            to: '/$teamId/invoices/$invoiceId',
            params: { teamId, invoiceId: invoice.invoiceId },
        });
    };

    return (
        <div className='flex flex-1 flex-col gap-0'>
            {/* Header */}
            <div className='mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4'>
                <div>
                    <h1 className='text-base font-semibold'>Invoices</h1>
                    {data && (
                        <p className='text-xs text-ink-muted'>
                            {data.total} invoice{data.total !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
                <UploadDialog teamId={teamId} />
            </div>

            {/* Content */}
            <div className='mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-auto px-6'>
                {isLoading && <InvoiceTableSkeleton />}
                {isError && (
                    <ErrorState
                        message='Failed to load invoices'
                        onRetry={() => window.location.reload()}
                    />
                )}
                {!isLoading && !isError && invoices.length === 0 && (
                    <InvoiceEmptyListing
                        hasFilters={false}
                        onClear={() => {}}
                    />
                )}
                {!isLoading && !isError && invoices.length > 0 && (
                    <InvoiceDataTable
                        columns={invoiceColumns}
                        data={invoices}
                        onRowClick={handleRowClick}
                    />
                )}
            </div>
        </div>
    );
}
