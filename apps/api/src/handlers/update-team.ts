import { assertActiveMembership, parseBody, requireRole, resolveRawTeamRequest } from '@vault/auth';
import { getConfig } from '@vault/config';
import { UpdateTeamRequestSchema } from '@vault/contracts';
import { MembershipRepository, TeamRepository } from '@vault/data-access';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const body = parseBody(event, UpdateTeamRequestSchema);
    const config = getConfig();

    const membership = await new MembershipRepository(config.MEMBERSHIP_TABLE!).findByIds(
        teamId,
        userId
    );
    assertActiveMembership(membership, teamId, userId);
    requireRole(membership, 'ADMIN');

    const teamRepo = new TeamRepository(config.TEAM_TABLE!);
    if (body.name) await teamRepo.updateName(teamId, body.name);

    return ok(await teamRepo.getById(teamId));
};

export const handler = createHandler(lambdaHandler);
