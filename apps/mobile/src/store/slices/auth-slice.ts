import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
    confirmSignUp,
    fetchAuthSession,
    getCurrentUser,
    signIn,
    signOut,
    signUp,
} from 'aws-amplify/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthUser {
    username: string;
    userId: string;
}

interface AuthState {
    user: AuthUser | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    // Tracks the username between sign-up and confirmation screens
    pendingUsername: string | null;
}

// ─── Thunks ──────────────────────────────────────────────────────────────────

export const initAuth = createAsyncThunk('auth/init', async () => {
    await fetchAuthSession();
    const user = await getCurrentUser();
    return { username: user.username, userId: user.userId };
});

export const signInThunk = createAsyncThunk(
    'auth/signIn',
    async ({ username, password }: { username: string; password: string }) => {
        await signIn({ username, password });
        const user = await getCurrentUser();
        return { username: user.username, userId: user.userId };
    }
);

export const signUpThunk = createAsyncThunk(
    'auth/signUp',
    async ({ username, password }: { username: string; password: string }) => {
        await signUp({
            username,
            password,
            options: { userAttributes: { email: username } },
        });
        return username;
    }
);

export const confirmSignUpThunk = createAsyncThunk(
    'auth/confirm',
    async ({ username, code }: { username: string; code: string }) => {
        await confirmSignUp({ username, confirmationCode: code });
    }
);

export const signOutThunk = createAsyncThunk('auth/signOut', async () => {
    await signOut();
});

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState: AuthState = {
    user: null,
    status: 'idle',
    error: null,
    pendingUsername: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // ── initAuth ──────────────────────────────────────────────────────
        builder
            .addCase(initAuth.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(initAuth.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.user = action.payload;
            })
            .addCase(initAuth.rejected, (state) => {
                // No active session — not an error, just unauthenticated
                state.status = 'idle';
                state.user = null;
            });

        // ── signIn ────────────────────────────────────────────────────────
        builder
            .addCase(signInThunk.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(signInThunk.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.user = action.payload;
            })
            .addCase(signInThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message ?? 'Sign in failed';
            });

        // ── signUp ────────────────────────────────────────────────────────
        builder
            .addCase(signUpThunk.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(signUpThunk.fulfilled, (state, action) => {
                state.status = 'idle';
                state.pendingUsername = action.payload;
            })
            .addCase(signUpThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message ?? 'Sign up failed';
            });

        // ── confirmSignUp ─────────────────────────────────────────────────
        builder
            .addCase(confirmSignUpThunk.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(confirmSignUpThunk.fulfilled, (state) => {
                state.status = 'idle';
                state.pendingUsername = null;
            })
            .addCase(confirmSignUpThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message ?? 'Confirmation failed';
            });

        // ── signOut ───────────────────────────────────────────────────────
        builder.addCase(signOutThunk.fulfilled, (state) => {
            state.user = null;
            state.status = 'idle';
            state.error = null;
        });
    },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
