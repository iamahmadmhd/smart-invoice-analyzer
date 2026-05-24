import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useBootstrap } from '@/hooks/use-bootstrap';
import { useTeamStore } from '@/stores/team';
import { PageLoader } from '#/components/ui/page-loader';
import { Button } from '#/components/ui/button';

export const Route = createFileRoute('/(app)/')({ component: AppIndex });

function AppIndex() {
    const navigate = useNavigate();
    const activeTeamId = useTeamStore((s) => s.activeTeamId);
    const { isError, error, isReady } = useBootstrap();

    // Redirect once we have an active team
    useEffect(() => {
        if (isReady && activeTeamId) {
            navigate({ to: '/$teamId/invoices', params: { teamId: activeTeamId }, replace: true });
        }
    }, [isReady, activeTeamId, navigate]);

    if (isError) {
        return (
            <div className='flex min-h-svh flex-col items-center justify-center gap-3'>
                <p className='text-sm font-medium text-destructive'>
                    Failed to load your workspace
                </p>
                <p className='text-xs text-muted-foreground'>
                    {error instanceof Error ? error.message : 'Unknown error'}
                </p>
                <Button
                    variant='link'
                    onClick={() => window.location.reload()}
                >
                    Try again
                </Button>
            </div>
        );
    }

    return <PageLoader />;
}
