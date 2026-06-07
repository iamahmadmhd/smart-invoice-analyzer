import { IconAlertTriangle, IconCopy } from '@tabler/icons-react';
import type { Invoice } from '#/api/invoices';
import { Badge } from '#/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '#/components/ui/table';
import { CATEGORY_LABELS, STATUS_CONFIG } from '#/constants/invoice';
import { formatters } from '#/lib/formatters';

function InvoiceTable({
    invoices,
    teamId,
    navigate,
}: {
    invoices: Array<Invoice>;
    teamId: string;
    navigate: any;
}) {
    return (
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
                                {formatters.date(invoice.invoiceDate)}
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
                                {formatters.amount(invoice.totalAmount, invoice.currency)}
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
    );
}

export { InvoiceTable };
