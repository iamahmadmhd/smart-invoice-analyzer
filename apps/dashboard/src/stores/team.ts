import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Team } from '@/api/teams';

interface TeamState {
    teams: Array<Team>;
    activeTeamId: string | null;

    setTeams: (teams: Array<Team>) => void;
    setActiveTeamId: (teamId: string) => void;
    getActiveTeam: () => Team | null;
    reset: () => void;
}

export const useTeamStore = create<TeamState>()(
    persist(
        (set, get) => ({
            teams: [],
            activeTeamId: null,

            setTeams: (teams) => set({ teams }),

            setActiveTeamId: (teamId) => set({ activeTeamId: teamId }),

            getActiveTeam: () => {
                const { teams, activeTeamId } = get();
                return teams.find((t) => t.teamId === activeTeamId) ?? null;
            },

            reset: () => set({ teams: [], activeTeamId: null }),
        }),
        {
            name: 'sia-team',
            // Only persist the active selection — teams are refetched on load
            partialize: (state) => ({ activeTeamId: state.activeTeamId }),
        }
    )
);
