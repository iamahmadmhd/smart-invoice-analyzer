import {
    assertActiveMembership,
    parseBody,
    requireRole,
    resolveRawTeamRequest,
} from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { UpdateTeamRequestSchema } from '@smart-invoice-analyzer/contracts';
import { MembershipRepository, TeamRepository } from '@smart-invoice-analyzer/data-access';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const body = parseBody(event, UpdateTeamRequestSchema);
    const config = getConfig();

    const membership = await new MembershipRepository(config.MEMBERSHIP_TABLE).findByIds(
        teamId,
        userId
    );
    assertActiveMembership(membership, teamId, userId);
    requireRole(membership, 'ADMIN');

    const teamRepo = new TeamRepository(config.TEAM_TABLE);
    if (body.name) await teamRepo.updateName(teamId, body.name);

    return ok(await teamRepo.getById(teamId));
};

export const handler = createHandler(lambdaHandler);
