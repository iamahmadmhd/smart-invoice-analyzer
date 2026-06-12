import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useBootstrap } from '@/features/teams';
import { PageLoader } from '@/components/ui/page-loader';
import { ErrorState } from '@/components/common';
import { lastTeam } from '@/lib/last-team';

export const Route = createFileRoute('/(app)/')({ component: AppIndex });

function AppIndex() {
    const navigate = useNavigate();
    const activeTeamId = lastTeam.get();
    const { isError, error, isReady } = useBootstrap();

    useEffect(() => {
        if (isReady && activeTeamId) {
            navigate({
                to: '/$teamId/invoices',
                params: { teamId: activeTeamId },
                search: {
                    vendorName: undefined,
                    status: undefined,
                    category: undefined,
                    duplicateFlag: undefined,
                    anomalyFlag: undefined,
                },
                replace: true,
            });
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
