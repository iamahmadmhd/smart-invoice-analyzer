import { IconAlertTriangle, IconArrowsSort, IconCopy } from '@tabler/icons-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Invoice } from '@/api/invoices';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CATEGORY_LABELS, STATUS_CONFIG } from '@/constants/invoice';
import { formatters } from '@/lib/formatters';

export const invoiceColumns: Array<ColumnDef<Invoice>> = [
    {
        accessorKey: 'invoiceNumber',
        header: '#',
        cell: ({ row }) => {
            return (
                <span className='text-sm text-ink-muted'>{row.original.invoiceNumber ?? '—'}</span>
            );
        },
    },
    {
        accessorKey: 'vendorName',
        header: ({ column }) => {
            return (
                <Button
                    variant='ghost'
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className='h-auto p-0 hover:bg-transparent'
                >
                    Vendor
                    <IconArrowsSort
                        size={14}
                        className='ml-1'
                    />
                </Button>
            );
        },
        cell: ({ row }) => {
            const invoice = row.original;
            return (
                <div className='flex items-center gap-2'>
                    <span className='max-w-45 truncate font-medium'>
                        {invoice.vendorName ?? (
                            <span className='font-normal text-ink-faint'>Unknown vendor</span>
                        )}
                    </span>
                    <div className='flex items-center gap-1'>
                        {invoice.duplicateFlag && (
                            <span title='Possible duplicate'>
                                <IconCopy
                                    size={13}
                                    className='text-amber'
                                />
                            </span>
                        )}
                        {invoice.anomalyFlag && (
                            <span title='Anomaly detected'>
                                <IconAlertTriangle
                                    size={13}
                                    className='text-crimson'
                                />
                            </span>
                        )}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'invoiceDate',
        header: ({ column }) => {
            return (
                <Button
                    variant='ghost'
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className='h-auto p-0 hover:bg-transparent'
                >
                    Date
                    <IconArrowsSort
                        size={14}
                        className='ml-1'
                    />
                </Button>
            );
        },
        cell: ({ row }) => {
            return (
                <span className='text-sm text-ink-muted tabular-nums'>
                    {formatters.date(row.original.invoiceDate)}
                </span>
            );
        },
    },
    {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => {
            const category = row.original.category;
            return category ? (
                <span className='text-xs text-ink-muted capitalize'>
                    {CATEGORY_LABELS[category]}
                </span>
            ) : (
                <span className='text-xs text-ink-faint'>—</span>
            );
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id));
        },
    },
    {
        accessorKey: 'totalAmount',
        header: ({ column }) => {
            return (
                <Button
                    variant='ghost'
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className='ml-auto h-auto p-0 hover:bg-transparent'
                >
                    Total
                    <IconArrowsSort
                        size={14}
                        className='ml-1'
                    />
                </Button>
            );
        },
        cell: ({ row }) => {
            const invoice = row.original;
            return (
                <div className='text-right font-medium tabular-nums'>
                    {formatters.amount(invoice.totalAmount, invoice.currency)}
                </div>
            );
        },
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.original.status;
            return (
                <Badge variant={STATUS_CONFIG[status].variant}>{STATUS_CONFIG[status].label}</Badge>
            );
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id));
        },
    },
    {
        accessorKey: 'exportStatus',
        header: '',
        cell: ({ row }) => {
            return row.original.exportStatus === 'EXPORTED' ? (
                <span className='text-[10px] tracking-wider text-ink-faint uppercase'>
                    Exported
                </span>
            ) : null;
        },
    },
];
