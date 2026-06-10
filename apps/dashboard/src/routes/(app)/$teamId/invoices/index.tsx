import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import type { Invoice, InvoiceCategoryFilter, InvoiceStatusFilter } from '@/api/invoices';
import {
    InvoiceDataTable,
    InvoiceEmptyListing,
    InvoiceTableSkeleton,
    UploadDialog,
    invoiceColumns,
    useInvoiceFilters,
    useInvoices,
} from '@/features/invoices';
import { ErrorState } from '@/components/common';

export const Route = createFileRoute('/(app)/$teamId/invoices/')({
    validateSearch: (search: Record<string, unknown>) => {
        return {
            vendorName: (search.vendorName as string) || undefined,
            status: (search.status as InvoiceStatusFilter) || undefined,
            category: (search.category as InvoiceCategoryFilter) || undefined,
            duplicateFlag:
                search.duplicateFlag === 'true' || search.duplicateFlag === true ? true : undefined,
            anomalyFlag:
                search.anomalyFlag === 'true' || search.anomalyFlag === true ? true : undefined,
        };
    },
    component: InvoicesList,
});

export function InvoicesList() {
    const { teamId } = useParams({ from: '/(app)/$teamId/invoices/' });
    const navigate = useNavigate();
    const { filters, activeCount, clear } = useInvoiceFilters();
    const { data, isLoading, isError } = useInvoices(teamId, filters);

    const invoices: Array<Invoice> = data?.invoices ?? [];
    const hasFilters = activeCount > 0 || !!filters.vendorName;

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
                        hasFilters={hasFilters}
                        onClear={clear}
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
