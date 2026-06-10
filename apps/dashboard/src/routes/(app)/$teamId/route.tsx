import { createFileRoute, redirect } from '@tanstack/react-router';
import { AppShell } from '@/components/layouts';
import { queryClient } from '@/lib/query-client';
import { bootstrap, listTeams } from '@/api/teams';
import { useTeamStore } from '@/stores/team';
import { ErrorState } from '@/components/common';

export const Route = createFileRoute('/(app)/$teamId')({
    beforeLoad: async ({ context, params }) => {
        if (!context.isAuthenticated) {
            throw redirect({ to: '/signin' });
        }

        try {
            // Step 1: Ensure bootstrap query has run
            await queryClient.ensureQueryData({
                queryKey: ['bootstrap'],
                queryFn: bootstrap,
                staleTime: Infinity,
            });

            // Step 2: Ensure teams query has run
            const teams = await queryClient.ensureQueryData({
                queryKey: ['teams'],
                queryFn: listTeams,
                staleTime: 60_000,
            });

            // Step 3: Validate team ID and redirect if invalid
            const isValid = teams.some((t) => t.teamId === params.teamId);
            if (!isValid) {
                throw redirect({ to: '/' });
            }

            // Step 4: Set active team ID
            useTeamStore.getState().setActiveTeamId(params.teamId);
        } catch (error) {
            // Rethrow redirects (which are thrown by TanStack Router under the hood)
            if (error && (error as any).status === 307) {
                throw error;
            }
            console.error('Bootstrap / validation error:', error);
            throw redirect({ to: '/signin' });
        }
    },
    component: AppShell,
    errorComponent: () => (
        <ErrorState
            message='Failed to load workspace'
            className='min-h-svh'
        />
    ),
});
