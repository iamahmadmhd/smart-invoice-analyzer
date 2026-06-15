import { assertActiveMembership, resolveRawTeamRequest } from '@vault/auth';
import { getConfig } from '@vault/config';
import { MembershipRepository } from '@vault/data-access';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const config = getConfig();

    const repo = new MembershipRepository(config.MEMBERSHIP_TABLE!);
    const membership = await repo.findByIds(teamId, userId);
    assertActiveMembership(membership, teamId, userId);

    const members = await repo.listByTeam(teamId);
    return ok({ members, total: members.length });
};

export const handler = createHandler(lambdaHandler);
