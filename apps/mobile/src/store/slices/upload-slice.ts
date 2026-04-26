import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createInvoice, presignUpload, uploadToS3 } from '@/lib/api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

type ContentType = 'application/pdf' | 'image/jpeg' | 'image/png';

export interface UploadFile {
    uri: string;
    fileName: string;
    contentType: ContentType;
    fileSizeBytes: number;
}

interface UploadState {
    status: 'idle' | 'presigning' | 'uploading' | 'creating' | 'succeeded' | 'failed';
    progress: number; // 0–1
    invoiceId: string | null;
    error: string | null;
}

const initialState: UploadState = {
    status: 'idle',
    progress: 0,
    invoiceId: null,
    error: null,
};

// ── Thunk ─────────────────────────────────────────────────────────────────────

export const uploadInvoice = createAsyncThunk(
    'upload/uploadInvoice',
    async (file: UploadFile, { dispatch, rejectWithValue }) => {
        try {
            // 1. Presign
            dispatch(uploadSlice.actions.setStage('presigning'));
            const { uploadUrl, fileObjectId } = await presignUpload(
                file.fileName,
                file.contentType,
                file.fileSizeBytes
            );

            // 2. Upload to S3
            dispatch(uploadSlice.actions.setStage('uploading'));
            await uploadToS3(uploadUrl, file.uri, file.contentType);
            dispatch(uploadSlice.actions.setProgress(0.6));

            // 3. Create invoice record
            dispatch(uploadSlice.actions.setStage('creating'));
            const result = await createInvoice(fileObjectId, file.fileName, file.contentType);
            dispatch(uploadSlice.actions.setProgress(1));

            return result.invoiceId;
        } catch (error: any) {
            return rejectWithValue(error?.message ?? 'Upload failed');
        }
    }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const uploadSlice = createSlice({
    name: 'upload',
    initialState,
    reducers: {
        resetUpload(state) {
            state.status = 'idle';
            state.progress = 0;
            state.invoiceId = null;
            state.error = null;
        },
        setStage(state, action: { payload: 'presigning' | 'uploading' | 'creating' }) {
            state.status = action.payload;
            if (action.payload === 'presigning') state.progress = 0.1;
            if (action.payload === 'uploading') state.progress = 0.3;
            if (action.payload === 'creating') state.progress = 0.8;
        },
        setProgress(state, action: { payload: number }) {
            state.progress = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(uploadInvoice.pending, (state) => {
                state.status = 'presigning';
                state.progress = 0.05;
                state.error = null;
                state.invoiceId = null;
            })
            .addCase(uploadInvoice.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.progress = 1;
                state.invoiceId = action.payload;
            })
            .addCase(uploadInvoice.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
                state.progress = 0;
            });
    },
});

export const { resetUpload } = uploadSlice.actions;
export default uploadSlice.reducer;
