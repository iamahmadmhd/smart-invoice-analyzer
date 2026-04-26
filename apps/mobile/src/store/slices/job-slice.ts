import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, ProcessingJob } from '@/lib/api-client';

interface JobState {
    currentJob: ProcessingJob | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: JobState = {
    currentJob: null,
    status: 'idle',
    error: null,
};

export const fetchJob = createAsyncThunk(
    'jobs/fetchOne',
    async (jobId: string, { rejectWithValue }) => {
        try {
            return await api.getJob(jobId);
        } catch (err: any) {
            return rejectWithValue(err.message ?? 'Failed to fetch job');
        }
    }
);

const jobSlice = createSlice({
    name: 'jobs',
    initialState,
    reducers: {
        clearJob(state) {
            state.currentJob = null;
            state.status = 'idle';
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchJob.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchJob.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.currentJob = action.payload;
            })
            .addCase(fetchJob.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            });
    },
});

export const { clearJob } = jobSlice.actions;
export default jobSlice.reducer;
