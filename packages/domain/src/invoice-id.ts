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

export function generateExportId(): string {
    return `exp_${randomUUID()}`;
}

export function generateFileObjectId(): string {
    return `file_${randomUUID()}`;
}

export function generateTeamId(): string {
    return `team_${randomUUID()}`;
}

export function generateInvitationId(): string {
    return `inv_${randomUUID()}`;
}

export function generateInvitationToken(): string {
    // 32-byte hex token — URL-safe, unpredictable
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}
