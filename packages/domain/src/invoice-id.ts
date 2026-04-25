import { randomUUID } from 'crypto';

export function generateInvoiceId(): string {
    return `inv_${randomUUID()}`;
}

export function generateJobId(): string {
    return `job_${randomUUID()}`;
}

export function generateInsightId(): string {
    return `ins_${randomUUID()}`;
}

export function generateExportBatchId(): string {
    return `exp_${randomUUID()}`;
}

export function generateFileObjectId(): string {
    return `file_${randomUUID()}`;
}
