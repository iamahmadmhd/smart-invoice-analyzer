import { createExport, getExport, listExports, validateExport } from '@/lib/api/exports';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    CreateExportRequest,
    ExportBatch,
    ExportPeriod,
    ValidationReport,
} from '@smart-invoice-analyzer/contracts';

// ── Wizard state ──────────────────────────────────────────────────────────────

export interface ExportWizardDraft {
    period: ExportPeriod;
    includeDocumentReferences: boolean;
}

export type WizardStep = 'period' | 'confirm';

// ── State ─────────────────────────────────────────────────────────────────────

interface ExportsState {
    // List
    items: ExportBatch[];
    listStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    listError: string | null;

    // Detail / polling
    currentBatch: ExportBatch | null;
    detailStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    detailError: string | null;

    // Wizard
    wizardStep: WizardStep;
    wizardDraft: Partial<ExportWizardDraft>;
    validationReport: ValidationReport | null;
    pendingExportBatchId: string | null;
    wizardStatus: 'idle' | 'validating' | 'creating' | 'succeeded' | 'failed';
    wizardError: string | null;
}

const initialDraft: Partial<ExportWizardDraft> = {
    includeDocumentReferences: false,
};

const initialState: ExportsState = {
    items: [],
    listStatus: 'idle',
    listError: null,

    currentBatch: null,
    detailStatus: 'idle',
    detailError: null,

    wizardStep: 'period',
    wizardDraft: initialDraft,
    validationReport: null,
    pendingExportBatchId: null,
    wizardStatus: 'idle',
    wizardError: null,
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchExports = createAsyncThunk(
    'exports/fetchList',
    async (_, { rejectWithValue }) => {
        try {
            return await listExports();
        } catch (e: any) {
            return rejectWithValue(e.message ?? 'Failed to load exports');
        }
    }
);

export const fetchExportDetail = createAsyncThunk(
    'exports/fetchDetail',
    async (exportBatchId: string, { rejectWithValue }) => {
        try {
            return await getExport(exportBatchId);
        } catch (e: any) {
            return rejectWithValue(e.message ?? 'Failed to load export');
        }
    }
);

export const runValidateExport = createAsyncThunk(
    'exports/validate',
    async (body: CreateExportRequest, { rejectWithValue }) => {
        try {
            return await validateExport(body);
        } catch (e: any) {
            return rejectWithValue(e.message ?? 'Validation failed');
        }
    }
);

export const runCreateExport = createAsyncThunk(
    'exports/create',
    async (
        { exportBatchId, body }: { exportBatchId: string; body: CreateExportRequest },
        { rejectWithValue }
    ) => {
        try {
            return await createExport(exportBatchId, body);
        } catch (e: any) {
            return rejectWithValue(e.message ?? 'Export creation failed');
        }
    }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const exportsSlice = createSlice({
    name: 'exports',
    initialState,
    reducers: {
        setWizardStep(state, action: PayloadAction<WizardStep>) {
            state.wizardStep = action.payload;
        },
        updateWizardDraft(state, action: PayloadAction<Partial<ExportWizardDraft>>) {
            state.wizardDraft = { ...state.wizardDraft, ...action.payload };
        },
        resetWizard(state) {
            state.wizardStep = 'period';
            state.wizardDraft = initialDraft;
            state.validationReport = null;
            state.pendingExportBatchId = null;
            state.wizardStatus = 'idle';
            state.wizardError = null;
        },
        setCurrentBatch(state, action: PayloadAction<ExportBatch>) {
            state.currentBatch = action.payload;
        },
    },
    extraReducers: (builder) => {
        // fetch list
        builder
            .addCase(fetchExports.pending, (state) => {
                state.listStatus = 'loading';
                state.listError = null;
            })
            .addCase(fetchExports.fulfilled, (state, action) => {
                state.listStatus = 'succeeded';
                state.items = action.payload.exports;
            })
            .addCase(fetchExports.rejected, (state, action) => {
                state.listStatus = 'failed';
                state.listError = action.payload as string;
            });

        // fetch detail
        builder
            .addCase(fetchExportDetail.pending, (state) => {
                state.detailStatus = 'loading';
                state.detailError = null;
            })
            .addCase(fetchExportDetail.fulfilled, (state, action) => {
                state.detailStatus = 'succeeded';
                state.currentBatch = action.payload;
            })
            .addCase(fetchExportDetail.rejected, (state, action) => {
                state.detailStatus = 'failed';
                state.detailError = action.payload as string;
            });

        // validate
        builder
            .addCase(runValidateExport.pending, (state) => {
                state.wizardStatus = 'validating';
                state.wizardError = null;
            })
            .addCase(runValidateExport.fulfilled, (state, action) => {
                state.wizardStatus = 'idle';
                state.validationReport = action.payload.report;
                state.pendingExportBatchId = action.payload.exportBatchId;
                state.wizardStep = 'confirm';
            })
            .addCase(runValidateExport.rejected, (state, action) => {
                state.wizardStatus = 'failed';
                state.wizardError = action.payload as string;
            });

        // create
        builder
            .addCase(runCreateExport.pending, (state) => {
                state.wizardStatus = 'creating';
                state.wizardError = null;
            })
            .addCase(runCreateExport.fulfilled, (state) => {
                state.wizardStatus = 'succeeded';
                state.listStatus = 'idle'; // trigger re-fetch
            })
            .addCase(runCreateExport.rejected, (state, action) => {
                state.wizardStatus = 'failed';
                state.wizardError = action.payload as string;
            });
    },
});

export const { setWizardStep, updateWizardDraft, resetWizard, setCurrentBatch } =
    exportsSlice.actions;
export default exportsSlice.reducer;
