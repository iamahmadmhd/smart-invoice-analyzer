import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from '@/components/ui/empty';

interface InvoiceEmptyDetailProps {
    teamId: string;
}

export function InvoiceEmptyDetail({ teamId }: InvoiceEmptyDetailProps) {
    return (
        <Empty className='flex-1'>
            <EmptyHeader>
                <EmptyTitle className='text-destructive'>Failed to load invoice</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
                <Button
                    variant='outline'
                    size='sm'
                    asChild
                >
                    <Link
                        to='/$teamId/invoices'
                        params={{ teamId }}
                    >
                        Back to invoices
                    </Link>
                </Button>
            </EmptyContent>
        </Empty>
    );
}
