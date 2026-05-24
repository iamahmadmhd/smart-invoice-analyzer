import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { bootstrap, listTeams } from '@/api/teams';
import { useTeamStore } from '@/stores/team';

/**
 * Runs the bootstrap → list-teams sequence once on app entry.
 *
 * - Calls POST /bootstrap (idempotent — creates a personal team if the user
 *   has none, otherwise returns existing team IDs).
 * - Fetches GET /teams to get full team objects with roles.
 * - Writes results into the team store and picks an active team.
 */
export function useBootstrap() {
    const { setTeams, setActiveTeamId, activeTeamId } = useTeamStore();

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

    // Sync teams into Zustand and pick active team
    useEffect(() => {
        if (!teamsQuery.data?.length) return;

        setTeams(teamsQuery.data);

        // Keep the persisted selection if still valid; else default to first team
        const stillValid = teamsQuery.data.some((t) => t.teamId === activeTeamId);
        if (!stillValid) {
            setActiveTeamId(teamsQuery.data[0].teamId);
        }
    }, [teamsQuery.data, activeTeamId, setTeams, setActiveTeamId]);

    return {
        isLoading: bootstrapQuery.isPending || teamsQuery.isPending,
        isError: bootstrapQuery.isError || teamsQuery.isError,
        error: bootstrapQuery.error ?? teamsQuery.error,
        teams: teamsQuery.data ?? [],
        isReady: teamsQuery.isSuccess,
    };
}
