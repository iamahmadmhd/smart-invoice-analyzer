import {
    IconAlertTriangle,
    IconArrowLeft,
    IconCopy,
    IconEdit,
    IconSparkles,
    IconTrash,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ConfidenceBar } from './confidence-bar';
import { DeleteDialog } from './delete-dialog';
import { EditSheet } from './edit-sheet';
import { InvoiceDetailSkeleton } from './invoice-detail-skeleton';
import type { AnomalyPayload, DuplicatePayload, SummaryPayload } from '@/api/insights';
import { getInsights } from '@/api/insights';
import { getInvoice } from '@/api/invoices';
import { AppAlert } from '@/components/common/app-alert';
import { DataRow } from '@/components/common/data-row';
import { InvoiceEmptyDetail } from '@/components/common/invoice-empty-detail';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CATEGORY_LABELS, STATUS_CONFIG } from '@/constants/invoice';
import { formatters } from '@/lib/formatters';

export function InvoiceDetail() {
    const { teamId, invoiceId } = useParams({ from: '/(app)/$teamId/invoices/$invoiceId' });
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const invoiceQuery = useQuery({
        queryKey: ['invoice', teamId, invoiceId],
        queryFn: () => getInvoice(teamId, invoiceId),
        staleTime: 30_000,
    });

    const insightsQuery = useQuery({
        queryKey: ['insights', teamId, invoiceId],
        queryFn: () => getInsights(teamId, invoiceId),
        staleTime: 60_000,
        enabled: invoiceQuery.isSuccess,
    });

    useEffect(() => {
        console.log('insights', insightsQuery.data);
    }, [insightsQuery]);

    if (invoiceQuery.isPending) return <InvoiceDetailSkeleton />;

    if (invoiceQuery.isError || !invoiceQuery.data) {
        return <InvoiceEmptyDetail teamId={teamId} />;
    }

    const invoice = invoiceQuery.data;
    const insights = insightsQuery.data?.insights ?? [];
    const summary = insights.find((i) => i.type === 'SUMMARY');
    const duplicate = insights.find((i) => i.type === 'DUPLICATE');
    const anomaly = insights.find((i) => i.type === 'ANOMALY');

    const { variant: statusVariant, label: statusLabel } = STATUS_CONFIG[invoice.status];
    const isExported = invoice.exportStatus === 'EXPORTED';
    const canEdit = !isExported;

    return (
        <div className='mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6'>
            {/* Back */}
            <div>
                <Button
                    variant='ghost'
                    className='-ml-2'
                    asChild
                >
                    <Link
                        to='/$teamId/invoices'
                        params={{ teamId }}
                    >
                        <IconArrowLeft />
                        Back to invoices
                    </Link>
                </Button>
            </div>

            {/* Header */}
            <div className='flex items-start justify-between gap-4'>
                <div className='flex flex-col gap-1'>
                    <div className='flex items-center gap-4'>
                        <h1 className='truncate text-xl font-semibold'>
                            {invoice.vendorName ?? 'Untitled invoice'}
                        </h1>
                        <Badge variant={statusVariant}>{statusLabel}</Badge>
                    </div>
                    {invoice.invoiceNumber && (
                        <div>
                            <p className='text-sm text-ink-muted'>#{invoice.invoiceNumber}</p>
                        </div>
                    )}
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                    {canEdit && (
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setEditOpen(true)}
                        >
                            <IconEdit size={13} />
                            Edit
                        </Button>
                    )}
                    {canEdit && (
                        <Button
                            variant='destructive'
                            size='icon-sm'
                            onClick={() => setDeleteOpen(true)}
                        >
                            <IconTrash size={13} />
                        </Button>
                    )}
                </div>
            </div>

            {/* Flag callouts */}
            {(invoice.duplicateFlag || invoice.anomalyFlag || summary) && (
                <div className='space-y-2'>
                    {summary && (
                        <AppAlert
                            title='AI Summary'
                            description={[(summary.payload as unknown as SummaryPayload).summary]}
                            icon={<IconSparkles />}
                        />
                    )}
                    {invoice.duplicateFlag && (
                        <AppAlert
                            title='Possible Duplicate'
                            description={
                                (duplicate?.payload as unknown as DuplicatePayload).reasons ??
                                'A similar invoice was found in your records.'
                            }
                            variant='danger'
                            icon={<IconCopy />}
                        />
                    )}
                    {invoice.anomalyFlag && (
                        <AppAlert
                            title='Anomaly Detected'
                            description={
                                (anomaly?.payload as unknown as AnomalyPayload).reasons ?? []
                            }
                            variant='danger'
                            icon={<IconAlertTriangle />}
                        />
                    )}
                </div>
            )}

            {/* Exported notice */}
            {isExported && <AppAlert />}

            {/* Content grid */}
            <div className='grid gap-4 lg:grid-cols-2'>
                {/* Financial */}
                <Card>
                    <CardHeader className='border-b'>
                        <CardTitle className='text-sm font-semibold'>Financial Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className='flex flex-col gap-1'>
                        <div className='flex items-baseline justify-between py-1'>
                            <span className='text-sm text-ink-muted'>Total</span>
                            <span className='text-2xl font-semibold tabular-nums'>
                                {formatters.amount(invoice.totalAmount, invoice.currency)}
                            </span>
                        </div>
                        <Separator className='my-1' />
                        <DataRow label='Net amount'>
                            {formatters.amount(invoice.netAmount, invoice.currency)}
                        </DataRow>
                        <DataRow
                            label={
                                invoice.taxRate !== undefined ? `Tax (${invoice.taxRate}%)` : 'Tax'
                            }
                        >
                            {formatters.amount(invoice.taxAmount, invoice.currency)}
                        </DataRow>
                        <DataRow label='Currency'>{invoice.currency}</DataRow>
                    </CardContent>
                </Card>

                {/* Details */}
                <Card>
                    <CardHeader className='border-b'>
                        <CardTitle className='text-sm font-semibold'>Invoice Details</CardTitle>
                    </CardHeader>
                    <CardContent className='flex flex-col gap-1'>
                        <DataRow label='Invoice date'>
                            {formatters.date(invoice.invoiceDate)}
                        </DataRow>
                        <DataRow label='Due date'>{formatters.date(invoice.dueDate)}</DataRow>
                        <DataRow label='Category'>
                            {invoice.category ? (
                                <span className='rounded-full bg-brand-subtle px-2 py-0.5 text-xs font-medium text-brand capitalize'>
                                    {CATEGORY_LABELS[invoice.category]}
                                </span>
                            ) : (
                                '—'
                            )}
                        </DataRow>
                        {invoice.vatIdOrTaxNumber && (
                            <DataRow label='VAT / Tax ID'>{invoice.vatIdOrTaxNumber}</DataRow>
                        )}
                        {invoice.confidenceScore !== undefined && (
                            <>
                                <Separator className='my-1' />
                                <ConfidenceBar score={invoice.confidenceScore} />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialogs */}
            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                invoice={invoice}
                teamId={teamId}
            />
            <EditSheet
                open={editOpen}
                onOpenChange={setEditOpen}
                invoice={invoice}
                teamId={teamId}
            />
        </div>
    );
}
