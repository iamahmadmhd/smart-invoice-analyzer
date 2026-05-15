import { assertActiveMembership, resolveRawTeamRequest } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { MembershipRepository } from '@smart-invoice-analyzer/data-access';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const config = getConfig();

    const repo = new MembershipRepository(config.MEMBERSHIP_TABLE);
    const membership = await repo.findByIds(teamId, userId);
    assertActiveMembership(membership, teamId, userId);

    const members = await repo.listByTeam(teamId);
    return ok({ members, total: members.length });
};

export const handler = createHandler(lambdaHandler);
