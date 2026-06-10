import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export function InvoiceTableSkeleton() {
    return (
        <div className='overflow-hidden rounded-lg border'>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Vendor</TableHead>
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
        </div>
    );
}
