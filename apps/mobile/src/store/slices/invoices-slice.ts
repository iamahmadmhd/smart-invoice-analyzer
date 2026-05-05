import { deleteInvoice, listInvoices, updateInvoice } from '@/lib/api/invoices';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Invoice, InvoiceStatus, UpdateInvoiceRequest } from '@smart-invoice-analyzer/contracts';

export interface InvoiceFilters {
    status?: InvoiceStatus;
    category?: string;
    vendorName?: string;
    dateFrom?: string;
    dateTo?: string;
    duplicateFlag?: boolean;
    anomalyFlag?: boolean;
}

interface InvoicesState {
    items: Invoice[];
    nextToken?: string;
    hasMore: boolean;
    status: 'idle' | 'loading' | 'loadingMore' | 'succeeded' | 'failed';
    error: string | null;
    filters: InvoiceFilters;
    searchQuery: string;
}

const initialState: InvoicesState = {
    items: [],
    nextToken: undefined,
    hasMore: false,
    status: 'idle',
    error: null,
    filters: {},
    searchQuery: '',
};

export const fetchInvoices = createAsyncThunk(
    'invoices/fetch',
    async (filters: InvoiceFilters & { nextToken?: string }, { rejectWithValue }) => {
        try {
            return await listInvoices({ ...filters, limit: 20 });
        } catch (e: any) {
            return rejectWithValue(e.message ?? 'Failed to load invoices');
        }
    }
);

export const fetchMoreInvoices = createAsyncThunk(
    'invoices/fetchMore',
    async (
        { filters, nextToken }: { filters: InvoiceFilters; nextToken: string },
        { rejectWithValue }
    ) => {
        try {
            return await listInvoices({ ...filters, limit: 20, nextToken });
        } catch (e: any) {
            return rejectWithValue(e.message ?? 'Failed to load more invoices');
        }
    }
);

export const updateInvoiceThunk = createAsyncThunk(
    'invoices/update',
    async (
        { invoiceId, patch }: { invoiceId: string; patch: UpdateInvoiceRequest },
        { rejectWithValue }
    ) => {
        try {
            return await updateInvoice(invoiceId, patch);
        } catch (e: any) {
            return rejectWithValue(e.message ?? 'Failed to update invoice');
        }
    }
);

export const deleteInvoiceThunk = createAsyncThunk(
    'invoices/delete',
    async (invoiceId: string, { rejectWithValue }) => {
        try {
            await deleteInvoice(invoiceId);
            return invoiceId;
        } catch (e: any) {
            return rejectWithValue(e.message ?? 'Failed to delete invoice');
        }
    }
);

const invoicesSlice = createSlice({
    name: 'invoices',
    initialState,
    reducers: {
        setFilters(state, action: PayloadAction<InvoiceFilters>) {
            state.filters = action.payload;
            state.items = [];
            state.nextToken = undefined;
            state.hasMore = false;
            state.status = 'idle';
        },
        setSearchQuery(state, action: PayloadAction<string>) {
            state.searchQuery = action.payload;
        },
        clearFilters(state) {
            state.filters = {};
            state.items = [];
            state.nextToken = undefined;
            state.hasMore = false;
            state.status = 'idle';
        },
        prependInvoice(state, action: PayloadAction<Invoice>) {
            state.items.unshift(action.payload);
        },
        updateInvoiceStatus(
            state,
            action: PayloadAction<{ invoiceId: string; status: InvoiceStatus }>
        ) {
            const invoice = state.items.find((i) => i.invoiceId === action.payload.invoiceId);
            if (invoice) invoice.status = action.payload.status;
        },
        updateInvoiceInList(state, action: PayloadAction<Invoice>) {
            const idx = state.items.findIndex((i) => i.invoiceId === action.payload.invoiceId);
            if (idx !== -1) state.items[idx] = action.payload;
        },
        removeInvoice(state, action: PayloadAction<string>) {
            state.items = state.items.filter((i) => i.invoiceId !== action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchInvoices.pending, (state) => {
                state.status = 'loading';
                state.error = null;
                state.items = [];
                state.nextToken = undefined;
            })
            .addCase(fetchInvoices.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload.invoices;
                state.nextToken = action.payload.nextToken;
                state.hasMore = !!action.payload.nextToken;
            })
            .addCase(fetchInvoices.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            .addCase(fetchMoreInvoices.pending, (state) => {
                state.status = 'loadingMore';
            })
            .addCase(fetchMoreInvoices.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items.push(...action.payload.invoices);
                state.nextToken = action.payload.nextToken;
                state.hasMore = !!action.payload.nextToken;
            })
            .addCase(fetchMoreInvoices.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            .addCase(updateInvoiceThunk.fulfilled, (state, action) => {
                const idx = state.items.findIndex((i) => i.invoiceId === action.payload.invoiceId);
                if (idx !== -1) state.items[idx] = action.payload;
            })
            .addCase(deleteInvoiceThunk.fulfilled, (state, action) => {
                state.items = state.items.filter((i) => i.invoiceId !== action.payload);
            });
    },
});

export const {
    setFilters,
    setSearchQuery,
    clearFilters,
    prependInvoice,
    updateInvoiceStatus,
    updateInvoiceInList,
    removeInvoice,
} = invoicesSlice.actions;
export default invoicesSlice.reducer;
