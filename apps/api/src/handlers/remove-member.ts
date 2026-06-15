import {
    assertActiveMembership,
    requirePathParam,
    requireRole,
    resolveRawTeamRequest,
} from '@vault/auth';
import { getConfig } from '@vault/config';
import { MembershipRepository } from '@vault/data-access';
import { assertNotLastOwner } from '@vault/domain';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { noContent } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const targetUserId = requirePathParam(event, 'userId');
    const config = getConfig();

    const repo = new MembershipRepository(config.MEMBERSHIP_TABLE!);
    const callerMembership = await repo.findByIds(teamId, userId);
    assertActiveMembership(callerMembership, teamId, userId);

    if (targetUserId !== userId) requireRole(callerMembership, 'ADMIN');

    const all = await repo.listByTeam(teamId);
    assertNotLastOwner(all, targetUserId);

    await repo.delete(teamId, targetUserId);
    return noContent();
};

export const handler = createHandler(lambdaHandler);
