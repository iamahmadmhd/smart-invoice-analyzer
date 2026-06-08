import { useNavigate, useParams } from '@tanstack/react-router';
import { IconAlertTriangle, IconCopy, IconFilter, IconSearch, IconX } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { UploadDialog } from './upload-dialog';
import { InvoiceTableSkeleton } from './invoice-table-skeleton';
import type { Invoice, InvoiceCategory, InvoiceStatus, ListInvoicesQuery } from '@/api/invoices';
import { useInvoices } from '@/features/invoices/hooks/use-invoices';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { InvoiceEmptyListing } from '#/features/invoices/components/invoice-empty-listing';
import {
    CATEGORY_LABELS,
    CATEGORY_OPTIONS,
    STATUS_CONFIG,
    STATUS_OPTIONS,
} from '@/constants/invoice';

function formatAmount(amount: number | undefined, currency: string) {
    if (amount === undefined) return '—';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
}

function formatDate(date: string | undefined) {
    if (!date) return '—';
    return new Intl.DateTimeFormat('de-DE').format(new Date(date));
}

export function InvoicesList() {
    const { teamId } = useParams({ from: '/(app)/$teamId/invoices/' });
    const navigate = useNavigate();

    const [vendorSearch, setVendorSearch] = useState('');
    const [debouncedVendor, setDebouncedVendor] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | undefined>();
    const [selectedCategory, setSelectedCategory] = useState<InvoiceCategory | undefined>();
    const [duplicateOnly, setDuplicateOnly] = useState(false);
    const [anomalyOnly, setAnomalyOnly] = useState(false);
    const vendorDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const handleVendorChange = (value: string) => {
        setVendorSearch(value);
        clearTimeout(vendorDebounceRef.current);
        vendorDebounceRef.current = setTimeout(() => setDebouncedVendor(value), 300);
    };

    const query: ListInvoicesQuery = {
        ...(selectedStatus && { status: selectedStatus }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(debouncedVendor && { vendorName: debouncedVendor }),
        ...(duplicateOnly && { duplicateFlag: true }),
        ...(anomalyOnly && { anomalyFlag: true }),
    };

    const { data, isLoading, isError } = useInvoices(teamId, query);

    const activeFilterCount =
        (selectedStatus ? 1 : 0) +
        (selectedCategory ? 1 : 0) +
        (duplicateOnly ? 1 : 0) +
        (anomalyOnly ? 1 : 0);

    const clearFilters = () => {
        setSelectedStatus(undefined);
        setSelectedCategory(undefined);
        setDuplicateOnly(false);
        setAnomalyOnly(false);
        setVendorSearch('');
        setDebouncedVendor('');
    };

    const invoices: Array<Invoice> = data?.invoices ?? [];
    const hasFilters = activeFilterCount > 0 || !!debouncedVendor;

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

            {/* Filter bar */}
            <div className='mx-auto flex w-full max-w-5xl items-center gap-2 px-6 py-3'>
                <div className='relative max-w-xs flex-1'>
                    <IconSearch
                        size={14}
                        className='absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-faint'
                    />
                    <Input
                        placeholder='Search vendor…'
                        value={vendorSearch}
                        onChange={(e) => handleVendorChange(e.target.value)}
                        className='h-8 pl-8 text-sm'
                    />
                    {vendorSearch && (
                        <button
                            onClick={() => {
                                setVendorSearch('');
                                setDebouncedVendor('');
                            }}
                            className='absolute top-1/2 right-2 -translate-y-1/2 text-ink-faint hover:text-ink'
                        >
                            <IconX size={13} />
                        </button>
                    )}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant='outline'
                            size='sm'
                            className='h-8 gap-1.5'
                        >
                            <IconFilter size={13} />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className='flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground'>
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align='start'
                        className='w-52'
                    >
                        <DropdownMenuLabel>Status</DropdownMenuLabel>
                        {STATUS_OPTIONS.map((s) => (
                            <DropdownMenuCheckboxItem
                                key={s}
                                checked={selectedStatus === s}
                                onCheckedChange={(checked) =>
                                    setSelectedStatus(checked ? s : undefined)
                                }
                            >
                                {STATUS_CONFIG[s].label}
                            </DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Category</DropdownMenuLabel>
                        {CATEGORY_OPTIONS.map((c) => (
                            <DropdownMenuCheckboxItem
                                key={c}
                                checked={selectedCategory === c}
                                onCheckedChange={(checked) =>
                                    setSelectedCategory(checked ? c : undefined)
                                }
                            >
                                {CATEGORY_LABELS[c]}
                            </DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Flags</DropdownMenuLabel>
                        <DropdownMenuCheckboxItem
                            checked={duplicateOnly}
                            onCheckedChange={setDuplicateOnly}
                        >
                            Duplicates only
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={anomalyOnly}
                            onCheckedChange={setAnomalyOnly}
                        >
                            Anomalies only
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {activeFilterCount > 0 && (
                    <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 text-ink-faint'
                        onClick={clearFilters}
                    >
                        Clear
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className='mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-auto px-6'>
                {isLoading && (
                    <div className='overflow-hidden rounded-lg border'>
                        <InvoiceTableSkeleton />
                    </div>
                )}
                {isError && (
                    <Empty className='flex-1'>
                        <EmptyHeader>
                            <EmptyTitle className='text-destructive'>
                                Failed to load invoices
                            </EmptyTitle>
                        </EmptyHeader>
                        <EmptyContent>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => window.location.reload()}
                            >
                                Retry
                            </Button>
                        </EmptyContent>
                    </Empty>
                )}
                {!isLoading && !isError && invoices.length === 0 && (
                    <InvoiceEmptyListing
                        hasFilters={hasFilters}
                        onClear={clearFilters}
                    />
                )}
                {!isLoading && !isError && invoices.length > 0 && (
                    <div className='overflow-hidden rounded-lg border'>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Vendor</TableHead>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className='text-right'>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className='w-16' />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((invoice) => (
                                    <TableRow
                                        key={invoice.invoiceId}
                                        className='cursor-pointer'
                                        onClick={() =>
                                            navigate({
                                                to: '/$teamId/invoices/$invoiceId',
                                                params: { teamId, invoiceId: invoice.invoiceId },
                                            })
                                        }
                                    >
                                        <TableCell className='font-medium'>
                                            <div className='flex items-center gap-2'>
                                                <span className='max-w-45 truncate'>
                                                    {invoice.vendorName ?? (
                                                        <span className='font-normal text-ink-faint'>
                                                            Unknown vendor
                                                        </span>
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
                                        </TableCell>
                                        <TableCell className='text-sm text-ink-muted'>
                                            {invoice.invoiceNumber ?? '—'}
                                        </TableCell>
                                        <TableCell className='text-sm text-ink-muted tabular-nums'>
                                            {formatDate(invoice.invoiceDate)}
                                        </TableCell>
                                        <TableCell>
                                            {invoice.category ? (
                                                <span className='text-xs text-ink-muted capitalize'>
                                                    {CATEGORY_LABELS[invoice.category]}
                                                </span>
                                            ) : (
                                                <span className='text-xs text-ink-faint'>—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className='text-right font-medium tabular-nums'>
                                            {formatAmount(invoice.totalAmount, invoice.currency)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={STATUS_CONFIG[invoice.status].variant}>
                                                {STATUS_CONFIG[invoice.status].label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {invoice.exportStatus === 'EXPORTED' && (
                                                <span className='text-[10px] tracking-wider text-ink-faint uppercase'>
                                                    Exported
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
