import {
    CreateExportRequest,
    ExportBatch,
    ExportDownloadResponse,
    ValidationReport,
} from '@smart-invoice-analyzer/contracts';
import { apiRequest } from './client';

export interface ListExportsResponse {
    exports: ExportBatch[];
    total: number;
}

export interface ValidateExportResponse {
    exportBatchId: string;
    report: ValidationReport;
}

export interface CreateExportResponse {
    exportBatchId: string;
    status: string;
}

export async function validateExport(body: CreateExportRequest): Promise<ValidateExportResponse> {
    return apiRequest<ValidateExportResponse>('/exports/validate', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export async function createExport(
    exportBatchId: string,
    body: CreateExportRequest
): Promise<CreateExportResponse> {
    return apiRequest<CreateExportResponse>('/exports', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export async function listExports(): Promise<ListExportsResponse> {
    return apiRequest<ListExportsResponse>('/exports');
}

export async function getExport(exportBatchId: string): Promise<ExportBatch> {
    return apiRequest<ExportBatch>(`/exports/${exportBatchId}`);
}

export async function downloadExport(exportBatchId: string): Promise<ExportDownloadResponse> {
    return apiRequest<ExportDownloadResponse>(`/exports/${exportBatchId}/download`);
}

export async function getExportReport(exportBatchId: string): Promise<ValidationReport> {
    return apiRequest<ValidationReport>(`/exports/${exportBatchId}/report`);
}
