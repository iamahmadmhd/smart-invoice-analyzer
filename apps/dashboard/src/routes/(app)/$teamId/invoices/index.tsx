import { createFileRoute, useParams } from '@tanstack/react-router';
import {
    IconAlertTriangle,
    IconCheck,
    IconCopy,
    IconFile,
    IconFileTypePdf,
    IconFilter,
    IconPhoto,
    IconReceipt,
    IconSearch,
    IconUpload,
    IconX,
} from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import type {
    AllowedContentType,
    InvoiceCategory,
    InvoiceStatus,
    ListInvoicesQuery,
} from '@/api/invoices';
import { useInvoices } from '@/hooks/use-invoices';
import { createInvoice, presignUpload, uploadFileToS3 } from '@/api/invoices';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/(app)/$teamId/invoices/')({
    component: InvoicesPage,
});

// ── Constants ──────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES: Array<AllowedContentType> = ['application/pdf', 'image/jpeg', 'image/png'];
const ACCEPTED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png';

const STATUS_CONFIG: Record<
    InvoiceStatus,
    { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
    UPLOADED: { label: 'Uploaded', variant: 'secondary' },
    PROCESSING: { label: 'Processing', variant: 'secondary' },
    EXTRACTED: { label: 'Extracted', variant: 'secondary' },
    ENRICHED: { label: 'Enriched', variant: 'secondary' },
    REVIEW_READY: { label: 'Review Ready', variant: 'outline' },
    COMPLETED: { label: 'Completed', variant: 'default' },
    FAILED_OCR: { label: 'OCR Failed', variant: 'destructive' },
    FAILED_VALIDATION: { label: 'Validation Failed', variant: 'destructive' },
    FAILED_AI: { label: 'AI Failed', variant: 'destructive' },
    FAILED_INTERNAL: { label: 'Internal Error', variant: 'destructive' },
};

const CATEGORY_LABELS: Record<InvoiceCategory, string> = {
    software: 'Software',
    hardware: 'Hardware',
    office: 'Office',
    travel: 'Travel',
    marketing: 'Marketing',
    utilities: 'Utilities',
    consulting: 'Consulting',
    other: 'Other',
};

const STATUS_OPTIONS: Array<InvoiceStatus> = [
    'COMPLETED',
    'REVIEW_READY',
    'PROCESSING',
    'UPLOADED',
    'FAILED_OCR',
    'FAILED_AI',
    'FAILED_VALIDATION',
    'FAILED_INTERNAL',
];

const CATEGORY_OPTIONS: Array<InvoiceCategory> = [
    'software',
    'hardware',
    'office',
    'travel',
    'marketing',
    'utilities',
    'consulting',
    'other',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAmount(amount: number | undefined, currency: string) {
    if (amount === undefined) return '—';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
}

function formatDate(date: string | undefined) {
    if (!date) return '—';
    return new Intl.DateTimeFormat('de-DE').format(new Date(date));
}

function getFileIcon(type: string) {
    if (type === 'application/pdf') return IconFileTypePdf;
    if (type.startsWith('image/')) return IconPhoto;
    return IconFile;
}

function getContentType(file: File): AllowedContentType | null {
    if (ACCEPTED_TYPES.includes(file.type as AllowedContentType)) {
        return file.type as AllowedContentType;
    }
    return null;
}

// ── Upload dialog ─────────────────────────────────────────────────────────────

type UploadStage = 'idle' | 'uploading' | 'creating' | 'done' | 'error';

function UploadDialog({ teamId }: { teamId: string }) {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
    const [stage, setStage] = useState<UploadStage>('idle');
    const [progress, setProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');

    const reset = () => {
        setFile(null);
        setStage('idle');
        setProgress(0);
        setErrorMessage('');
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) reset();
        setOpen(next);
    };

    const handleFile = (candidate: File) => {
        const ct = getContentType(candidate);
        if (!ct) {
            setErrorMessage('Only PDF, JPEG, and PNG files are supported.');
            return;
        }
        setErrorMessage('');
        setFile(candidate);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) handleFile(dropped);
    }, []);

    const handleUpload = async () => {
        if (!file) return;
        const contentType = getContentType(file);
        if (!contentType) return;

        setStage('uploading');
        setProgress(0);
        setErrorMessage('');

        try {
            const { uploadUrl, fileObjectId } = await presignUpload(
                teamId,
                file.name,
                contentType,
                file.size
            );

            await uploadFileToS3(uploadUrl, file, setProgress);

            setStage('creating');
            await createInvoice(teamId, fileObjectId, file.name, contentType);

            setStage('done');
            queryClient.invalidateQueries({ queryKey: ['invoices', teamId] });

            setTimeout(() => handleOpenChange(false), 1200);
        } catch (err) {
            setStage('error');
            setErrorMessage(
                err instanceof Error ? err.message : 'Upload failed. Please try again.'
            );
        }
    };

    const isUploading = stage === 'uploading' || stage === 'creating';

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
        >
            <DialogTrigger asChild>
                <Button size='sm'>
                    <IconUpload size={14} />
                    Upload invoice
                </Button>
            </DialogTrigger>

            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>Upload invoice</DialogTitle>
                    <DialogDescription>
                        PDF, JPEG, or PNG — the document will be processed automatically.
                    </DialogDescription>
                </DialogHeader>

                <div className='flex flex-col gap-4 py-2'>
                    {/* Drop zone */}
                    <button
                        type='button'
                        disabled={isUploading || stage === 'done'}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        className={cn(
                            'relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-sm transition-colors',
                            'hover:border-primary/60 hover:bg-primary/5',
                            dragging && 'border-primary bg-primary/5',
                            !dragging && !file && 'border-wire',
                            file &&
                                !isUploading &&
                                stage !== 'done' &&
                                'border-primary/40 bg-primary/5',
                            (isUploading || stage === 'done') && 'pointer-events-none'
                        )}
                    >
                        {stage === 'done' ? (
                            <>
                                <div className='flex size-10 items-center justify-center rounded-full bg-jade-subtle text-jade'>
                                    <IconCheck size={20} />
                                </div>
                                <p className='font-medium text-jade'>Invoice uploaded</p>
                            </>
                        ) : file ? (
                            <>
                                {(() => {
                                    const Icon = getFileIcon(file.type);
                                    return (
                                        <Icon
                                            size={32}
                                            className='text-primary'
                                        />
                                    );
                                })()}
                                <div className='text-center'>
                                    <p className='max-w-65 truncate font-medium'>{file.name}</p>
                                    <p className='mt-0.5 text-xs text-ink-faint'>
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                                {!isUploading && (
                                    <button
                                        type='button'
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                        }}
                                        className='absolute top-3 right-3 text-ink-faint hover:text-ink'
                                    >
                                        <IconX size={15} />
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <div className='flex size-10 items-center justify-center rounded-full bg-muted'>
                                    <IconUpload
                                        size={18}
                                        className='text-ink-faint'
                                    />
                                </div>
                                <div className='text-center'>
                                    <p className='font-medium'>
                                        Drop a file or <span className='text-primary'>browse</span>
                                    </p>
                                    <p className='mt-1 text-xs text-ink-faint'>
                                        PDF, JPEG, PNG up to 10 MB
                                    </p>
                                </div>
                            </>
                        )}
                    </button>

                    <input
                        ref={fileInputRef}
                        type='file'
                        accept={ACCEPTED_EXTENSIONS}
                        className='sr-only'
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFile(f);
                            e.target.value = '';
                        }}
                    />

                    {/* Progress */}
                    {isUploading && (
                        <div className='flex flex-col gap-1.5'>
                            <div className='flex justify-between text-xs text-ink-muted'>
                                <span>
                                    {stage === 'uploading'
                                        ? 'Uploading…'
                                        : 'Creating invoice record…'}
                                </span>
                                {stage === 'uploading' && <span>{progress}%</span>}
                            </div>
                            <Progress
                                value={stage === 'uploading' ? progress : 100}
                                className='h-1.5'
                            />
                        </div>
                    )}

                    {/* Error */}
                    {errorMessage && <p className='text-sm text-crimson'>{errorMessage}</p>}
                </div>

                <DialogFooter>
                    <Button
                        variant='outline'
                        onClick={() => handleOpenChange(false)}
                        disabled={isUploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!file || isUploading || stage === 'done'}
                    >
                        {isUploading ? 'Uploading…' : 'Upload'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function InvoicesPage() {
    const { teamId } = useParams({ from: '/(app)/$teamId' });

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

    const invoices = data?.invoices ?? [];

    return (
        <div className='flex flex-1 flex-col gap-0'>
            {/* Header */}
            <div className='flex items-center justify-between border-b border-border px-6 py-4'>
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
            <div className='flex items-center gap-2 border-b border-border px-6 py-3'>
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
            <div className='flex flex-1 flex-col overflow-auto'>
                {isError ? (
                    <div className='flex flex-1 flex-col items-center justify-center gap-2 text-sm text-destructive'>
                        Failed to load invoices.
                        <Button
                            variant='link'
                            size='sm'
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </Button>
                    </div>
                ) : isLoading ? (
                    <InvoicesTableSkeleton />
                ) : invoices.length === 0 ? (
                    <EmptyState
                        hasFilters={activeFilterCount > 0 || !!debouncedVendor}
                        onClear={clearFilters}
                    />
                ) : (
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
                                        <Badge
                                            variant={STATUS_CONFIG[invoice.status].variant}
                                            className='text-xs whitespace-nowrap'
                                        >
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
                )}
            </div>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function InvoicesTableSkeleton() {
    return (
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
                {Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell>
                            <Skeleton className='h-4 w-32' />
                        </TableCell>
                        <TableCell>
                            <Skeleton className='h-4 w-20' />
                        </TableCell>
                        <TableCell>
                            <Skeleton className='h-4 w-20' />
                        </TableCell>
                        <TableCell>
                            <Skeleton className='h-4 w-16' />
                        </TableCell>
                        <TableCell className='text-right'>
                            <Skeleton className='ml-auto h-4 w-20' />
                        </TableCell>
                        <TableCell>
                            <Skeleton className='h-5 w-20 rounded-full' />
                        </TableCell>
                        <TableCell />
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
    return (
        <div className='flex flex-1 flex-col items-center justify-center gap-3 text-center'>
            <div className='flex size-12 items-center justify-center rounded-xl border border-wire bg-canvas'>
                <IconReceipt
                    size={22}
                    className='text-ink-faint'
                />
            </div>
            {hasFilters ? (
                <>
                    <div>
                        <p className='text-sm font-medium'>No matching invoices</p>
                        <p className='mt-0.5 text-xs text-ink-muted'>Try adjusting your filters</p>
                    </div>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={onClear}
                    >
                        Clear filters
                    </Button>
                </>
            ) : (
                <div>
                    <p className='text-sm font-medium'>No invoices yet</p>
                    <p className='mt-0.5 text-xs text-ink-muted'>
                        Upload your first invoice using the button above
                    </p>
                </div>
            )}
        </div>
    );
}
