import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TeamState {
    activeTeamId: string | null;

    setActiveTeamId: (teamId: string) => void;
    reset: () => void;
}

export const useTeamStore = create<TeamState>()(
    persist(
        (set) => ({
            activeTeamId: null,

            setActiveTeamId: (teamId) => set({ activeTeamId: teamId }),

            reset: () => set({ activeTeamId: null }),
        }),
        {
            name: 'sia-team',
            partialize: (state) => ({ activeTeamId: state.activeTeamId }),
        }
    )
);
