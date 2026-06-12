import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { bootstrap, listTeams } from '@/api/teams';
import { lastTeam } from '@/lib/last-team';

/**
 * Runs the bootstrap → list-teams sequence once on app entry.
 *
 * - Calls POST /bootstrap (idempotent — creates a personal team if the user
 *   has none, otherwise returns existing team IDs).
 * - Fetches GET /teams to get full team objects with roles.
 * - Writes results into the team store and picks an active team.
 */
export function useBootstrap() {
    // Step 1 — bootstrap (creates team if needed)
    const bootstrapQuery = useQuery({
        queryKey: ['bootstrap'],
        queryFn: bootstrap,
        // Only run once per session; the result is stable
        staleTime: Infinity,
        retry: 2,
    });

    // Step 2 — list teams (enabled only after bootstrap succeeds)
    const teamsQuery = useQuery({
        queryKey: ['teams'],
        queryFn: listTeams,
        enabled: bootstrapQuery.isSuccess,
        staleTime: 60_000,
    });

    // Sync active team selection
    useEffect(() => {
        if (!teamsQuery.data?.length) return;

        // Keep the persisted selection if still valid; else default to first team
        const stillValid = teamsQuery.data.some((t) => t.teamId === lastTeam.get());
        if (!stillValid) {
            lastTeam.set(teamsQuery.data[0].teamId);
        }
    }, [teamsQuery.data, lastTeam]);

    return {
        isLoading: bootstrapQuery.isPending || teamsQuery.isPending,
        isError: bootstrapQuery.isError || teamsQuery.isError,
        error: bootstrapQuery.error ?? teamsQuery.error,
        teams: teamsQuery.data ?? [],
        isReady: teamsQuery.isSuccess,
    };
}
