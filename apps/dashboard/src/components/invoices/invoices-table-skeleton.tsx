import { Skeleton } from '../ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

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

export { InvoicesTableSkeleton };
