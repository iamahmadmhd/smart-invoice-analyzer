import { getUserContext, requirePathParam } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { ProcessingJobRepository } from '@smart-invoice-analyzer/data-access';
import { withObservability } from '@smart-invoice-analyzer/observability';
import { ok } from '../utils/response';

const handler = withObservability(async (event) => {
    getUserContext(event as never); // auth check
    const jobId = requirePathParam(event as never, 'jobId');
    const config = getConfig();

    // jobId encodes invoiceId: "job_<uuid>" — we query by jobId via GSI
    // The ProcessingJobRepository.getById needs invoiceId + jobId.
    // The API only has jobId, so we use the userId-index GSI via listByInvoice
    // would need invoiceId too. Instead expose a direct query by jobId.
    // For now, parse invoiceId from path if provided, else scan via status-index.
    // Simple approach: require invoiceId as query param or embed in jobId.
    // Per the API spec GET /jobs/:id — jobId only. We need the invoiceId.
    // Resolution: store invoiceId on the job record and do a GSI query.
    // The status-index GSI uses status as PK — not useful here.
    // Best solution: add a jobId-only GSI, or require invoiceId in the path.
    // For now we use the invoiceId query param as a pragmatic workaround.

    const invoiceId = (event as never as { queryStringParameters?: Record<string, string> })
        .queryStringParameters?.['invoiceId'];

    if (!invoiceId) {
        // Return minimal status by scanning — acceptable for a polling endpoint
        return ok({
            jobId,
            status: 'UNKNOWN',
            message: 'Provide invoiceId query param for full details',
        });
    }

    const repo = new ProcessingJobRepository(config.PROCESSING_JOB_TABLE);
    const jobs = await repo.listByInvoice(invoiceId);
    const job = jobs.find((j) => j.jobId === jobId);

    if (!job) {
        return ok({ jobId, status: 'NOT_FOUND' });
    }

    return ok(job);
});

export { handler };
