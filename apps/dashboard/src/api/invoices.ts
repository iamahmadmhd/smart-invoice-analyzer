import { apiClient } from '@/lib/api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

// Core status values
export type InvoiceStatus =
    | 'UPLOADED'
    | 'PROCESSING'
    | 'EXTRACTED'
    | 'ENRICHED'
    | 'REVIEW_READY'
    | 'COMPLETED'
    | 'FAILED_OCR'
    | 'FAILED_VALIDATION'
    | 'FAILED_AI'
    | 'FAILED_INTERNAL';

// Filter types (include undefined for "no filter")
export type InvoiceStatusFilter = InvoiceStatus | undefined;

export type ExportStatus = 'NOT_EXPORTED' | 'EXPORTED';

// Core category values
export type InvoiceCategory =
    | 'software'
    | 'hardware'
    | 'office'
    | 'travel'
    | 'marketing'
    | 'utilities'
    | 'consulting'
    | 'other';

// Filter type (includes undefined for "no filter")
export type InvoiceCategoryFilter = InvoiceCategory | undefined;

export type AllowedContentType = 'application/pdf' | 'image/jpeg' | 'image/png';

export interface Invoice {
    invoiceId: string;
    teamId: string;
    uploadedBy: string;
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
    category?: InvoiceCategory;
    status: InvoiceStatus;
    duplicateFlag: boolean;
    anomalyFlag: boolean;
    confidenceScore?: number;
    sourceFileId: string;
    exportId?: string;
    exportedAt?: string;
    exportStatus: ExportStatus;
    createdAt: string;
    updatedAt: string;
}

export interface ListInvoicesQuery {
    status?: InvoiceStatusFilter;
    exportStatus?: ExportStatus;
    category?: InvoiceCategoryFilter;
    vendorName?: string;
    dateFrom?: string;
    dateTo?: string;
    duplicateFlag?: boolean;
    anomalyFlag?: boolean;
    limit?: number;
    nextToken?: string;
}

export interface ListInvoicesResponse {
    invoices: Array<Invoice>;
    nextToken?: string;
    total: number;
}

export interface PresignResponse {
    uploadUrl: string;
    fileObjectId: string;
    expiresAt: string;
}

export interface CreateInvoiceResponse {
    invoiceId: string;
    status: InvoiceStatus;
}

export interface UpdateInvoiceRequest {
    vendorName?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    dueDate?: string;
    currency?: string;
    netAmount?: number;
    taxAmount?: number;
    taxRate?: number;
    totalAmount?: number;
    vatIdOrTaxNumber?: string;
    category?: InvoiceCategory;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export function listInvoices(
    teamId: string,
    query: ListInvoicesQuery = {}
): Promise<ListInvoicesResponse> {
    const params: Record<string, string | number | boolean | undefined> = {
        limit: query.limit ?? 50,
        ...(query.status && { status: query.status }),
        ...(query.exportStatus && { exportStatus: query.exportStatus }),
        ...(query.category && { category: query.category }),
        ...(query.vendorName && { vendorName: query.vendorName }),
        ...(query.dateFrom && { dateFrom: query.dateFrom }),
        ...(query.dateTo && { dateTo: query.dateTo }),
        ...(query.duplicateFlag !== undefined && { duplicateFlag: query.duplicateFlag }),
        ...(query.anomalyFlag !== undefined && { anomalyFlag: query.anomalyFlag }),
        ...(query.nextToken && { nextToken: query.nextToken }),
    };
    return apiClient.get<ListInvoicesResponse>(`/teams/${teamId}/invoices`, params);
}

export function getInvoice(teamId: string, invoiceId: string): Promise<Invoice> {
    return apiClient.get<Invoice>(`/teams/${teamId}/invoices/${invoiceId}`);
}

export function updateInvoice(
    teamId: string,
    invoiceId: string,
    body: UpdateInvoiceRequest
): Promise<Invoice> {
    return apiClient.patch<Invoice>(`/teams/${teamId}/invoices/${invoiceId}`, body);
}

export function deleteInvoice(teamId: string, invoiceId: string): Promise<void> {
    return apiClient.delete<void>(`/teams/${teamId}/invoices/${invoiceId}`);
}

export function presignUpload(
    teamId: string,
    fileName: string,
    contentType: AllowedContentType,
    fileSizeBytes: number
): Promise<PresignResponse> {
    return apiClient.post<PresignResponse>(`/teams/${teamId}/uploads/presign`, {
        fileName,
        contentType,
        fileSizeBytes,
    });
}

export async function uploadFileToS3(
    uploadUrl: string,
    file: File,
    onProgress?: (percent: number) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        if (onProgress) {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
            });
        }
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`S3 upload failed: ${xhr.status}`));
        });
        xhr.addEventListener('error', () => reject(new Error('S3 upload network error')));
        xhr.send(file);
    });
}

export function createInvoice(
    teamId: string,
    sourceFileId: string,
    fileName: string,
    contentType: AllowedContentType
): Promise<CreateInvoiceResponse> {
    return apiClient.post<CreateInvoiceResponse>(`/teams/${teamId}/invoices`, {
        sourceFileId,
        fileName,
        contentType,
    });
}
