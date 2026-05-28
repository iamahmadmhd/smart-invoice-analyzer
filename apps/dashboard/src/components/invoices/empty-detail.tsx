import { Link } from '@tanstack/react-router';
import { Button } from '../ui/button';
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from '../ui/empty';

function EmptyDetail({ teamId }: { teamId: string }) {
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

export { EmptyDetail };
