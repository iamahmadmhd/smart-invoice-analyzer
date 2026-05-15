import {
    assertActiveMembership,
    requirePathParam,
    resolveRawTeamRequest,
} from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { ExportRepository, MembershipRepository } from '@smart-invoice-analyzer/data-access';
import { NotFoundError } from '@smart-invoice-analyzer/errors';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const exportId = requirePathParam(event, 'exportId');
    const config = getConfig();

    const membership = await new MembershipRepository(config.MEMBERSHIP_TABLE).findByIds(
        teamId,
        userId
    );
    assertActiveMembership(membership, teamId, userId);

    const exportRecord = await new ExportRepository(config.EXPORT_TABLE).getById(teamId, exportId);
    if (!exportRecord.validationReport) throw new NotFoundError('ValidationReport', exportId);

    return ok(exportRecord.validationReport);
};

export const handler = createHandler(lambdaHandler);
