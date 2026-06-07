import { Skeleton } from '@/components/ui/skeleton';

export function InvoiceDetailSkeleton() {
    return (
        <div className='mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6'>
            <Skeleton className='h-8 w-32' />
            <div className='flex items-start justify-between'>
                <div className='flex flex-col gap-2'>
                    <Skeleton className='h-7 w-56' />
                    <Skeleton className='h-4 w-32' />
                </div>
                <div className='flex gap-2'>
                    <Skeleton className='h-7 w-20 rounded-full' />
                    <Skeleton className='h-9 w-16' />
                </div>
            </div>
            <div className='grid gap-4 lg:grid-cols-2'>
                <Skeleton className='h-52 rounded-xl' />
                <Skeleton className='h-52 rounded-xl' />
            </div>
        </div>
    );
}
