import {
    Invoice,
    ListInvoicesQuery,
    ListInvoicesResponse,
} from '@smart-invoice-analyzer/contracts';
import { apiRequest } from './client';

export async function listInvoices(
    query: Partial<ListInvoicesQuery> = {}
): Promise<ListInvoicesResponse> {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.exportStatus) params.set('exportStatus', query.exportStatus);
    if (query.category) params.set('category', query.category);
    if (query.vendorName) params.set('vendorName', query.vendorName);
    if (query.dateFrom) params.set('dateFrom', query.dateFrom);
    if (query.dateTo) params.set('dateTo', query.dateTo);
    if (query.duplicateFlag !== undefined) params.set('duplicateFlag', String(query.duplicateFlag));
    if (query.anomalyFlag !== undefined) params.set('anomalyFlag', String(query.anomalyFlag));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.nextToken) params.set('nextToken', query.nextToken);

    const qs = params.toString();
    return apiRequest<ListInvoicesResponse>(`/invoices${qs ? `?${qs}` : ''}`);
}

export async function getInvoice(invoiceId: string): Promise<Invoice> {
    return apiRequest<Invoice>(`/invoices/${invoiceId}`);
}
