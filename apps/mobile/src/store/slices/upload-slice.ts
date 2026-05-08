import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UploadStep =
    | 'idle'
    | 'selected'
    | 'uploading'
    | 'creating'
    | 'processing'
    | 'done'
    | 'error';

export interface SelectedFile {
    uri: string;
    name: string;
    contentType: 'application/pdf' | 'image/jpeg' | 'image/png';
    size: number;
}

interface UploadState {
    step: UploadStep;
    file: SelectedFile | null;
    uploadProgress: number;
    invoiceId: string | null;
    error: string | null;
}

const initialState: UploadState = {
    step: 'idle',
    file: null,
    uploadProgress: 0,
    invoiceId: null,
    error: null,
};

const uploadSlice = createSlice({
    name: 'upload',
    initialState,
    reducers: {
        selectFile(state, action: PayloadAction<SelectedFile>) {
            state.file = action.payload;
            state.step = 'selected';
            state.error = null;
            state.uploadProgress = 0;
            state.invoiceId = null;
        },
        startUpload(state) {
            state.step = 'uploading';
            state.uploadProgress = 0;
        },
        setProgress(state, action: PayloadAction<number>) {
            state.uploadProgress = action.payload;
        },
        startCreating(state) {
            state.step = 'creating';
            state.uploadProgress = 100;
        },
        startProcessing(state, action: PayloadAction<string>) {
            state.step = 'processing';
            state.invoiceId = action.payload;
        },
        uploadDone(state) {
            state.step = 'done';
        },
        uploadError(state, action: PayloadAction<string>) {
            state.step = 'error';
            state.error = action.payload;
        },
        reset(state) {
            Object.assign(state, initialState);
        },
    },
});

export const {
    selectFile,
    startUpload,
    setProgress,
    startCreating,
    startProcessing,
    uploadDone,
    uploadError,
    reset,
} = uploadSlice.actions;
export default uploadSlice.reducer;
