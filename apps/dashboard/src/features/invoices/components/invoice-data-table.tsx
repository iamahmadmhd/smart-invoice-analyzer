import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { IconFilter, IconSearch, IconX } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { useInvoiceFilters } from '../hooks/use-invoice-filters';
import type { ColumnDef, SortingState, VisibilityState } from '@tanstack/react-table';
import type { Invoice } from '@/api/invoices';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { CATEGORY_ENTRIES, STATUS_CONFIG, STATUS_OPTIONS } from '@/constants/invoice';

interface InvoiceDataTableProps {
    columns: Array<ColumnDef<Invoice>>;
    data: Array<Invoice>;
    onRowClick?: (invoice: Invoice) => void;
}

export function InvoiceDataTable({ columns, data, onRowClick }: InvoiceDataTableProps) {
    const { filters, setters, activeCount, clear } = useInvoiceFilters();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const [vendorSearch, setVendorSearch] = useState(filters.vendorName ?? '');

    // Sync input field value when URL changes
    useEffect(() => {
        setVendorSearch(filters.vendorName ?? '');
    }, [filters.vendorName]);

    const vendorDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const handleVendorChange = (value: string) => {
        setVendorSearch(value);
        clearTimeout(vendorDebounceRef.current);
        vendorDebounceRef.current = setTimeout(() => {
            setters.setVendorName(value || undefined);
        }, 300);
    };

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnVisibility,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    const rows = table.getRowModel().rows;

    const handleClearFilters = () => {
        clear();
        setVendorSearch('');
    };

    return (
        <div className='w-full space-y-3'>
            {/* Filter bar */}
            <div className='flex items-center gap-2'>
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
                                setters.setVendorName(undefined);
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
                            {activeCount > 0 && (
                                <span className='flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground'>
                                    {activeCount}
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
                                checked={filters.status === s}
                                onCheckedChange={(checked) =>
                                    setters.setStatus(checked ? s : undefined)
                                }
                            >
                                {STATUS_CONFIG[s].label}
                            </DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Category</DropdownMenuLabel>
                        {CATEGORY_ENTRIES.map(([c, label]) => (
                            <DropdownMenuCheckboxItem
                                key={c}
                                checked={filters.category === c}
                                onCheckedChange={(checked) =>
                                    setters.setCategory(checked ? c : undefined)
                                }
                            >
                                {label}
                            </DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Flags</DropdownMenuLabel>
                        <DropdownMenuCheckboxItem
                            checked={filters.duplicateFlag === true}
                            onCheckedChange={(checked) =>
                                setters.setDuplicateFlag(checked || undefined)
                            }
                        >
                            Duplicates only
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={filters.anomalyFlag === true}
                            onCheckedChange={(checked) =>
                                setters.setAnomalyFlag(checked || undefined)
                            }
                        >
                            Anomalies only
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {activeCount > 0 && (
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={handleClearFilters}
                    >
                        Clear
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className='overflow-hidden rounded-lg border'>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef.header,
                                                      header.getContext()
                                                  )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {rows.length ? (
                            rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className='cursor-pointer'
                                    onClick={() => onRowClick?.(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className='h-24 text-center'
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {rows.length > 0 && (
                <div className='flex items-center justify-between'>
                    <div className='text-sm text-muted-foreground'>
                        Showing {rows.length} of {data.length} invoice(s)
                    </div>
                    <div className='flex items-center space-x-2'>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
