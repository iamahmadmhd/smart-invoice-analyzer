import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api, Invoice, Insight, ListInvoicesParams } from '@/lib/api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface InvoiceState {
    items: Invoice[];
    selectedInvoice: Invoice | null;
    insights: Insight[];
    nextToken?: string;
    total: number;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    detailStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    insightStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    uploadStatus: 'idle' | 'uploading' | 'creating' | 'succeeded' | 'failed';
    error: string | null;
    uploadError: string | null;
    lastCreatedInvoiceId: string | null;
    filters: ListInvoicesParams;
}

const initialState: InvoiceState = {
    items: [],
    selectedInvoice: null,
    insights: [],
    nextToken: undefined,
    total: 0,
    status: 'idle',
    detailStatus: 'idle',
    insightStatus: 'idle',
    uploadStatus: 'idle',
    error: null,
    uploadError: null,
    lastCreatedInvoiceId: null,
    filters: { limit: '20' },
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchInvoices = createAsyncThunk(
    'invoices/fetchAll',
    async (params: ListInvoicesParams | undefined, { rejectWithValue }) => {
        try {
            return await api.listInvoices(params);
        } catch (err: any) {
            return rejectWithValue(err.message ?? 'Failed to load invoices');
        }
    }
);

export const fetchMoreInvoices = createAsyncThunk(
    'invoices/fetchMore',
    async (params: ListInvoicesParams, { rejectWithValue }) => {
        try {
            return await api.listInvoices(params);
        } catch (err: any) {
            return rejectWithValue(err.message ?? 'Failed to load more invoices');
        }
    }
);

export const fetchInvoice = createAsyncThunk(
    'invoices/fetchOne',
    async (invoiceId: string, { rejectWithValue }) => {
        try {
            return await api.getInvoice(invoiceId);
        } catch (err: any) {
            return rejectWithValue(err.message ?? 'Failed to load invoice');
        }
    }
);

export const fetchInsights = createAsyncThunk(
    'invoices/fetchInsights',
    async (invoiceId: string, { rejectWithValue }) => {
        try {
            return await api.getInsights(invoiceId);
        } catch (err: any) {
            return rejectWithValue(err.message ?? 'Failed to load insights');
        }
    }
);

export const uploadInvoice = createAsyncThunk(
    'invoices/upload',
    async (
        { file, fileName, contentType }: { file: Blob; fileName: string; contentType: string },
        { rejectWithValue }
    ) => {
        try {
            // 1. Get presigned URL
            const fileSizeBytes = file.size;
            const { uploadUrl, fileObjectId } = await api.presign(
                fileName,
                contentType,
                fileSizeBytes
            );

            // 2. Upload to S3
            await api.uploadToS3(uploadUrl, file, contentType);

            // 3. Create invoice record
            const { invoiceId } = await api.createInvoice(fileObjectId, fileName, contentType);

            return { invoiceId };
        } catch (err: any) {
            return rejectWithValue(err.message ?? 'Upload failed');
        }
    }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const invoiceSlice = createSlice({
    name: 'invoices',
    initialState,
    reducers: {
        clearError(state) {
            state.error = null;
            state.uploadError = null;
        },
        clearSelected(state) {
            state.selectedInvoice = null;
            state.insights = [];
            state.detailStatus = 'idle';
            state.insightStatus = 'idle';
        },
        clearUploadState(state) {
            state.uploadStatus = 'idle';
            state.uploadError = null;
            state.lastCreatedInvoiceId = null;
        },
        setFilters(state, action: PayloadAction<ListInvoicesParams>) {
            state.filters = { ...action.payload, limit: '20' };
        },
        updateInvoiceInList(state, action: PayloadAction<Invoice>) {
            const idx = state.items.findIndex((i) => i.invoiceId === action.payload.invoiceId);
            if (idx !== -1) state.items[idx] = action.payload;
            if (state.selectedInvoice?.invoiceId === action.payload.invoiceId) {
                state.selectedInvoice = action.payload;
            }
        },
    },
    extraReducers: (builder) => {
        // fetchInvoices
        builder
            .addCase(fetchInvoices.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchInvoices.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload.invoices;
                state.nextToken = action.payload.nextToken;
                state.total = action.payload.total;
            })
            .addCase(fetchInvoices.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            });

        // fetchMoreInvoices
        builder
            .addCase(fetchMoreInvoices.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchMoreInvoices.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = [...state.items, ...action.payload.invoices];
                state.nextToken = action.payload.nextToken;
                state.total = action.payload.total;
            })
            .addCase(fetchMoreInvoices.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            });

        // fetchInvoice
        builder
            .addCase(fetchInvoice.pending, (state) => {
                state.detailStatus = 'loading';
                state.error = null;
            })
            .addCase(fetchInvoice.fulfilled, (state, action) => {
                state.detailStatus = 'succeeded';
                state.selectedInvoice = action.payload;
            })
            .addCase(fetchInvoice.rejected, (state, action) => {
                state.detailStatus = 'failed';
                state.error = action.payload as string;
            });

        // fetchInsights
        builder
            .addCase(fetchInsights.pending, (state) => {
                state.insightStatus = 'loading';
            })
            .addCase(fetchInsights.fulfilled, (state, action) => {
                state.insightStatus = 'succeeded';
                state.insights = action.payload.insights;
            })
            .addCase(fetchInsights.rejected, (state) => {
                state.insightStatus = 'failed';
            });

        // uploadInvoice
        builder
            .addCase(uploadInvoice.pending, (state) => {
                state.uploadStatus = 'uploading';
                state.uploadError = null;
                state.lastCreatedInvoiceId = null;
            })
            .addCase(uploadInvoice.fulfilled, (state, action) => {
                state.uploadStatus = 'succeeded';
                state.lastCreatedInvoiceId = action.payload.invoiceId;
            })
            .addCase(uploadInvoice.rejected, (state, action) => {
                state.uploadStatus = 'failed';
                state.uploadError = action.payload as string;
            });
    },
});

export const { clearError, clearSelected, clearUploadState, setFilters, updateInvoiceInList } =
    invoiceSlice.actions;
export default invoiceSlice.reducer;
