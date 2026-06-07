import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { IconFilter, IconSearch, IconX } from '@tabler/icons-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
} from '@tanstack/react-table';
import type { Invoice, InvoiceCategory, InvoiceStatus } from '@/api/invoices';
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
import {
    CATEGORY_LABELS,
    CATEGORY_OPTIONS,
    STATUS_CONFIG,
    STATUS_OPTIONS,
} from '@/constants/invoice';

interface InvoiceDataTableProps {
    columns: Array<ColumnDef<Invoice>>;
    data: Array<Invoice>;
    onRowClick?: (invoice: Invoice) => void;
}

export function InvoiceDataTable({ columns, data, onRowClick }: InvoiceDataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

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

    // Apply filters
    useEffect(() => {
        const filters: ColumnFiltersState = [];

        if (debouncedVendor) {
            filters.push({ id: 'vendorName', value: debouncedVendor });
        }
        if (selectedStatus) {
            filters.push({ id: 'status', value: [selectedStatus] });
        }
        if (selectedCategory) {
            filters.push({ id: 'category', value: [selectedCategory] });
        }

        setColumnFilters(filters);
    }, [debouncedVendor, selectedStatus, selectedCategory]);

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
        },
        globalFilterFn: (row, columnId, filterValue) => {
            const vendorName = row.original.vendorName?.toLowerCase() ?? '';
            return vendorName.includes(filterValue.toLowerCase());
        },
        filterFns: {
            vendorNameFilter: (row, columnId, filterValue) => {
                const vendorName = row.original.vendorName?.toLowerCase() ?? '';
                return vendorName.includes(filterValue.toLowerCase());
            },
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    // Apply client-side flag filters
    const filteredRows = useMemo(() => {
        let rows = table.getRowModel().rows;

        if (duplicateOnly) {
            rows = rows.filter((row) => row.original.duplicateFlag);
        }
        if (anomalyOnly) {
            rows = rows.filter((row) => row.original.anomalyFlag);
        }

        return rows;
    }, [table.getRowModel().rows, duplicateOnly, anomalyOnly]);

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
        table.resetColumnFilters();
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
                        onClick={clearFilters}
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
                        {filteredRows.length ? (
                            filteredRows.map((row) => (
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
            {filteredRows.length > 0 && (
                <div className='flex items-center justify-between'>
                    <div className='text-sm text-muted-foreground'>
                        Showing {filteredRows.length} of {data.length} invoice(s)
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
