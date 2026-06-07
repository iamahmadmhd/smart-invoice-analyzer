import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useBootstrap } from '@/features/teams';
import { useTeamStore } from '@/stores/team';
import { PageLoader } from '@/components/layouts';
import { ErrorState } from '@/components/common';

export const Route = createFileRoute('/(app)/')({ component: AppIndex });

function AppIndex() {
    const navigate = useNavigate();
    const activeTeamId = useTeamStore((s) => s.activeTeamId);
    const { isError, error, isReady } = useBootstrap();

    useEffect(() => {
        if (isReady && activeTeamId) {
            navigate({ to: '/$teamId/invoices', params: { teamId: activeTeamId }, replace: true });
        }
    }, [isReady, activeTeamId, navigate]);

    if (isError) {
        const message = error instanceof Error ? error.message : 'Failed to load your workspace';
        return (
            <ErrorState
                message={message}
                className='min-h-svh'
            />
        );
    }

    return <PageLoader />;
}
