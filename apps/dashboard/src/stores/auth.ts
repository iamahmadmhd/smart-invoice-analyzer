import { signOut as amplifySignOut, fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { create } from 'zustand';

export interface AuthUser {
    userId: string;
    email: string;
    username: string;
}

interface AuthState {
    user: AuthUser | null;
    isInitialized: boolean;
    initialize: () => Promise<void>;
    setUser: (user: AuthUser | null) => void;
    signOut: () => Promise<void>;
    getToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isInitialized: false,

    initialize: async () => {
        try {
            const cognitoUser = await getCurrentUser();
            const session = await fetchAuthSession();
            const claims = session.tokens?.idToken?.payload;
            set({
                user: {
                    userId: cognitoUser.userId,
                    email: claims?.['email'] as string,
                    username: cognitoUser.username,
                },
                isInitialized: true,
            });
        } catch {
            set({ user: null, isInitialized: true });
        }
    },

    setUser: (user) => set({ user }),

    signOut: async () => {
        await amplifySignOut();
        set({ user: null });
    },

    getToken: async () => {
        try {
            const session = await fetchAuthSession();
            return session.tokens?.idToken?.toString() ?? null;
        } catch {
            return null;
        }
    },
}));
