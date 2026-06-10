import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
    message: string;
    onRetry?: () => void;
    className?: string;
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
    return (
        <Empty className={cn('flex-1', className)}>
            <EmptyHeader>
                <EmptyTitle className='text-destructive'>{message}</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
                <Button
                    variant='outline'
                    size='sm'
                    onClick={onRetry || (() => window.location.reload())}
                >
                    Retry
                </Button>
            </EmptyContent>
        </Empty>
    );
}
