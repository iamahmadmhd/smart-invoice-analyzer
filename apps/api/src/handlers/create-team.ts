import { getUserContext, parseBody } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { CreateTeamRequestSchema } from '@smart-invoice-analyzer/contracts';
import { MembershipRepository, TeamRepository } from '@smart-invoice-analyzer/data-access';
import { buildOwnerMembership, buildTeam } from '@smart-invoice-analyzer/domain';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { created } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { userId } = getUserContext(event);
    const body = parseBody(event, CreateTeamRequestSchema);
    const config = getConfig();

    const teamRepo = new TeamRepository(config.TEAM_TABLE);
    await teamRepo.assertSlugAvailable(body.slug);

    const team = buildTeam({ name: body.name, slug: body.slug, ownerId: userId });
    const membership = buildOwnerMembership(team.teamId, userId);

    await teamRepo.put(team);
    await new MembershipRepository(config.MEMBERSHIP_TABLE).put(membership);

    return created({ teamId: team.teamId, slug: team.slug });
};

export const handler = createHandler(lambdaHandler);
