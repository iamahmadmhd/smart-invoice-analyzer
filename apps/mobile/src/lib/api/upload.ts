import { apiRequest } from './client';

export interface PresignResponse {
    uploadUrl: string;
    fileObjectId: string;
    expiresAt: string;
}

export interface CreateInvoiceResponse {
    invoiceId: string;
    status: string;
}

export async function presignUpload(
    fileName: string,
    contentType: string,
    fileSizeBytes: number
): Promise<PresignResponse> {
    return apiRequest<PresignResponse>('/uploads/presign', {
        method: 'POST',
        body: JSON.stringify({ fileName, contentType, fileSizeBytes }),
    });
}

export async function uploadToS3(
    uploadUrl: string,
    file: Blob,
    contentType: string,
    onProgress?: (percent: number) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`S3 upload failed: ${xhr.status}`));
            }
        });

        xhr.addEventListener('error', () => reject(new Error('S3 upload network error')));
        xhr.addEventListener('abort', () => reject(new Error('S3 upload aborted')));

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', contentType);
        xhr.send(file);
    });
}

export async function createInvoice(
    sourceFileId: string,
    fileName: string,
    contentType: string
): Promise<CreateInvoiceResponse> {
    return apiRequest<CreateInvoiceResponse>('/invoices', {
        method: 'POST',
        body: JSON.stringify({ sourceFileId, fileName, contentType }),
    });
}
