import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useBootstrap } from '@/hooks/use-bootstrap';
import { useTeamStore } from '@/stores/team';
import { PageLoader } from '#/components/ui/page-loader';
import { Button } from '#/components/ui/button';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from '#/components/ui/empty';

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
            <Empty className='min-h-svh'>
                <EmptyHeader>
                    <EmptyTitle className='text-destructive'>
                        Failed to load your workspace
                    </EmptyTitle>
                    <EmptyDescription>
                        {error instanceof Error ? error.message : 'Unknown error'}
                    </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <Button
                        variant='outline'
                        onClick={() => window.location.reload()}
                    >
                        Try again
                    </Button>
                </EmptyContent>
            </Empty>
        );
    }

    return <PageLoader />;
}
