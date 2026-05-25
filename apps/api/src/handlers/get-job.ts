import {
    assertActiveMembership,
    requirePathParam,
    resolveRawTeamRequest,
} from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { MembershipRepository, ProcessingJobRepository } from '@smart-invoice-analyzer/data-access';
import { NotFoundError } from '@smart-invoice-analyzer/errors';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const jobId = requirePathParam(event, 'jobId');
    const config = getConfig();

    const membership = await new MembershipRepository(config.MEMBERSHIP_TABLE!).findByIds(
        teamId,
        userId
    );
    assertActiveMembership(membership, teamId, userId);

    const job = await new ProcessingJobRepository(config.PROCESSING_JOB_TABLE).getByJobId(jobId);

    // Verify the job belongs to this team
    if (job.teamId !== teamId) throw new NotFoundError('ProcessingJob', jobId);

    return ok(job);
};

export const handler = createHandler(lambdaHandler);
