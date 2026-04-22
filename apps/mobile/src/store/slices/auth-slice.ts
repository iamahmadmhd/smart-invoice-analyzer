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
    pendingUsername: string | null;
}

// ─── Error extraction ─────────────────────────────────────────────────────────
// Amplify v6 throws typed error classes (e.g. UserNotFoundException,
// NotAuthorizedException). RTK's miniSerializeError only reads `message` from
// plain Error objects — on iOS the JSI bridge may lose the property entirely,
// producing "An unknown error occurred". We catch explicitly and map known
// Cognito error names to user-friendly strings before calling rejectWithValue,
// so the slice always receives a plain serialisable string.

const COGNITO_MESSAGES: Record<string, string> = {
    NotAuthorizedException: 'Incorrect email or password.',
    UserNotFoundException: 'No account found for this email.',
    UserNotConfirmedException: 'Please verify your email before signing in.',
    UsernameExistsException: 'An account with this email already exists.',
    CodeMismatchException: 'Invalid verification code. Please try again.',
    ExpiredCodeException: 'The verification code has expired. Please request a new one.',
    LimitExceededException: 'Too many attempts. Please wait a moment and try again.',
    TooManyRequestsException: 'Too many requests. Please slow down and try again.',
    InvalidPasswordException: 'Password does not meet the requirements.',
    InvalidParameterException: 'Invalid input. Please check your details.',
    NetworkError: 'Network error. Please check your connection.',
};

function extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        // Amplify errors carry the Cognito error code in `name`
        const mapped = COGNITO_MESSAGES[error.name];
        if (mapped) return mapped;
        // Fall back to the raw message if it's a real string
        if (error.message && error.message !== 'An unknown error occurred') {
            return error.message;
        }
    }
    return 'Something went wrong. Please try again.';
}

// ─── Thunks ──────────────────────────────────────────────────────────────────

export const initAuth = createAsyncThunk('auth/init', async () => {
    await fetchAuthSession();
    const user = await getCurrentUser();
    return { username: user.username, userId: user.userId };
});

export const signInThunk = createAsyncThunk(
    'auth/signIn',
    async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
        try {
            await signIn({ username, password });
            const user = await getCurrentUser();
            return { username: user.username, userId: user.userId };
        } catch (error) {
            return rejectWithValue(extractErrorMessage(error));
        }
    }
);

export const signUpThunk = createAsyncThunk(
    'auth/signUp',
    async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
        try {
            await signUp({
                username,
                password,
                options: { userAttributes: { email: username } },
            });
            return username;
        } catch (error) {
            return rejectWithValue(extractErrorMessage(error));
        }
    }
);

export const confirmSignUpThunk = createAsyncThunk(
    'auth/confirm',
    async ({ username, code }: { username: string; code: string }, { rejectWithValue }) => {
        try {
            await confirmSignUp({ username, confirmationCode: code });
        } catch (error) {
            return rejectWithValue(extractErrorMessage(error));
        }
    }
);

export const signOutThunk = createAsyncThunk('auth/signOut', async (_, { rejectWithValue }) => {
    try {
        await signOut();
    } catch (error) {
        return rejectWithValue(extractErrorMessage(error));
    }
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
                state.error = action.payload as string;
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
                state.error = action.payload as string;
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
                state.error = action.payload as string;
            });

        // ── signOut ───────────────────────────────────────────────────────
        builder
            .addCase(signOutThunk.fulfilled, (state) => {
                state.user = null;
                state.status = 'idle';
                state.error = null;
            })
            .addCase(signOutThunk.rejected, (state, action) => {
                // Sign-out failure is rare — clear the user locally regardless
                state.user = null;
                state.status = 'idle';
                state.error = action.payload as string;
            });
    },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
