import { IconReceipt } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';

interface InvoiceEmptyListingProps {
    hasFilters: boolean;
    onClear: () => void;
}

export function InvoiceEmptyListing({ hasFilters, onClear }: InvoiceEmptyListingProps) {
    return (
        <Empty className='flex-1'>
            <EmptyHeader>
                <EmptyMedia variant='icon'>
                    <IconReceipt />
                </EmptyMedia>
                <EmptyTitle>{hasFilters ? 'No matching invoices' : 'No invoices yet'}</EmptyTitle>
                <EmptyDescription>
                    {hasFilters
                        ? 'Try adjusting your filters'
                        : 'Upload your first invoice using the button above'}
                </EmptyDescription>
            </EmptyHeader>
            {hasFilters && (
                <EmptyContent>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={onClear}
                    >
                        Clear filters
                    </Button>
                </EmptyContent>
            )}
        </Empty>
    );
}
