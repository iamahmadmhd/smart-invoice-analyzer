import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

class ApiError extends Error {
    constructor(
        public readonly statusCode: number,
        public readonly code: string,
        message: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

async function getAuthToken(): Promise<string> {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'No auth token available');
    return token;
}

async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | undefined>
): Promise<T> {
    const token = await getAuthToken();

    let url = `${API_BASE_URL}${path}`;
    if (params) {
        const qs = Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
            .join('&');
        if (qs) url += `?${qs}`;
    }

    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: token,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) return undefined as T;

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new ApiError(
            res.status,
            data.error ?? 'UNKNOWN_ERROR',
            data.message ?? `Request failed with status ${res.status}`
        );
    }

    return data as T;
}

// ── Invoice endpoints ─────────────────────────────────────────────────────────

export interface PresignResponse {
    uploadUrl: string;
    fileObjectId: string;
    expiresAt: string;
}

export interface Invoice {
    invoiceId: string;
    userId: string;
    vendorName?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    dueDate?: string;
    currency: string;
    netAmount?: number;
    taxAmount?: number;
    taxRate?: number;
    totalAmount?: number;
    vatIdOrTaxNumber?: string;
    category?: string;
    status: string;
    duplicateFlag: boolean;
    anomalyFlag: boolean;
    confidenceScore?: number;
    sourceFileId: string;
    exportBatchId?: string;
    exportedAt?: string;
    exportStatus: string;
    createdAt: string;
    updatedAt: string;
}

export interface ListInvoicesResponse {
    invoices: Invoice[];
    nextToken?: string;
    total: number;
}

export interface ListInvoicesParams {
    status?: string;
    exportStatus?: string;
    category?: string;
    vendorName?: string;
    dateFrom?: string;
    dateTo?: string;
    duplicateFlag?: string;
    anomalyFlag?: string;
    limit?: string;
    nextToken?: string;
}

export interface ProcessingJob {
    jobId: string;
    invoiceId: string;
    userId: string;
    stage: string;
    status: string;
    retryCount: number;
    errorCode?: string;
    errorMessage?: string;
    startedAt: string;
    completedAt?: string;
}

export interface Insight {
    insightId: string;
    userId: string;
    invoiceId: string;
    type: 'SUMMARY' | 'DUPLICATE' | 'ANOMALY' | 'CATEGORY';
    payload: Record<string, unknown>;
    createdAt: string;
}

export interface ExportBatch {
    exportBatchId: string;
    userId: string;
    periodStart: string;
    periodEnd: string;
    format: string;
    beraternummer: string;
    mandantennummer: string;
    sachkontenrahmen: string;
    sachkontenlaenge: number;
    status: string;
    validationReport?: ValidationReport;
    archiveS3Key?: string;
    createdAt: string;
    completedAt?: string;
}

export interface ValidationWarning {
    invoiceId: string;
    field: string;
    code: string;
    message: string;
}

export interface ValidationReport {
    totalInvoices: number;
    eligibleInvoices: number;
    skippedInvoices: number;
    warnings: ValidationWarning[];
    errors: ValidationWarning[];
    canProceed: boolean;
}

export interface QueryAnswer {
    answer: string;
    reliabilityScore: number;
    reliabilityLabel: 'HIGH' | 'MEDIUM' | 'LOW';
    disclaimer?: string;
}

export const api = {
    // ── Uploads ──────────────────────────────────────────────────────────────
    presign: (fileName: string, contentType: string, fileSizeBytes: number) =>
        request<PresignResponse>('POST', '/uploads/presign', {
            fileName,
            contentType,
            fileSizeBytes,
        }),

    uploadToS3: async (uploadUrl: string, file: Blob, contentType: string): Promise<void> => {
        const res = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': contentType },
            body: file,
        });
        if (!res.ok)
            throw new ApiError(res.status, 'S3_UPLOAD_FAILED', 'Failed to upload file to S3');
    },

    // ── Invoices ──────────────────────────────────────────────────────────────
    createInvoice: (sourceFileId: string, fileName: string, contentType: string) =>
        request<{ invoiceId: string; status: string }>('POST', '/invoices', {
            sourceFileId,
            fileName,
            contentType,
        }),

    listInvoices: (params?: ListInvoicesParams) =>
        request<ListInvoicesResponse>(
            'GET',
            '/invoices',
            undefined,
            params as Record<string, string | undefined>
        ),

    getInvoice: (invoiceId: string) => request<Invoice>('GET', `/invoices/${invoiceId}`),

    getInsights: (invoiceId: string) =>
        request<{ insights: Insight[] }>('GET', `/invoices/${invoiceId}/insights`),

    // ── Jobs ─────────────────────────────────────────────────────────────────
    getJob: (jobId: string) => request<ProcessingJob>('GET', `/jobs/${jobId}`),

    // ── Queries ───────────────────────────────────────────────────────────────
    query: (question: string) => request<QueryAnswer>('POST', '/queries', { question }),

    // ── Exports ───────────────────────────────────────────────────────────────
    validateExport: (payload: unknown) =>
        request<{ exportBatchId: string; report: ValidationReport }>(
            'POST',
            '/exports/validate',
            payload
        ),

    createExport: (payload: unknown) =>
        request<{ exportBatchId: string; status: string }>('POST', '/exports', payload),

    listExports: () => request<{ exports: ExportBatch[]; total: number }>('GET', '/exports'),

    getExport: (exportBatchId: string) => request<ExportBatch>('GET', `/exports/${exportBatchId}`),

    downloadExport: (exportBatchId: string) =>
        request<{ downloadUrl: string; expiresAt: string; archiveFilename: string }>(
            'GET',
            `/exports/${exportBatchId}/download`
        ),

    getExportReport: (exportBatchId: string) =>
        request<ValidationReport>('GET', `/exports/${exportBatchId}/report`),

    // ── User ─────────────────────────────────────────────────────────────────
    deleteAccount: () => request<void>('DELETE', '/users/me'),
};

export { ApiError };
