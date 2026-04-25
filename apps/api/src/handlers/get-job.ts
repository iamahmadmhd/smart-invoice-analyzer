import { getUserContext, requirePathParam } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { ProcessingJobRepository } from '@smart-invoice-analyzer/data-access';
import { NotFoundError, withObservability } from '@smart-invoice-analyzer/observability';
import { ok } from '../utils/response';

const handler = withObservability(async (event) => {
    const user = getUserContext(event as never);
    const jobId = requirePathParam(event as never, 'jobId');
    const config = getConfig();

    const repo = new ProcessingJobRepository(config.PROCESSING_JOB_TABLE);
    const job = await repo.getByJobId(jobId);

    // Ensure the job belongs to the requesting user
    if (job.userId !== user.userId) {
        throw new NotFoundError('ProcessingJob', jobId);
    }

    return ok(job);
});

export { handler };
