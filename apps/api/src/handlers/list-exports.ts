import { assertActiveMembership, resolveRawTeamRequest } from '@vault/auth';
import { getConfig } from '@vault/config';
import { ExportRepository, MembershipRepository } from '@vault/data-access';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const config = getConfig();

    const membership = await new MembershipRepository(config.MEMBERSHIP_TABLE!).findByIds(
        teamId,
        userId
    );
    assertActiveMembership(membership, teamId, userId);

    const exports = await new ExportRepository(config.EXPORT_TABLE).listByTeam(teamId);
    return ok({ exports, total: exports.length });
};

export const handler = createHandler(lambdaHandler);
