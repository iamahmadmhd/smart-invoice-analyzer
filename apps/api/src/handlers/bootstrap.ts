import { getUserContext } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { MembershipRepository, TeamRepository } from '@smart-invoice-analyzer/data-access';
import { buildOwnerMembership, buildTeam } from '@smart-invoice-analyzer/domain';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { userId, username } = getUserContext(event);
    const config = getConfig();

    const membershipRepo = new MembershipRepository(config.MEMBERSHIP_TABLE);
    const existing = await membershipRepo.listByUser(userId);

    if (existing.length > 0) {
        return ok({ bootstrapped: false, teams: existing.map((m) => m.teamId) });
    }

    const slug = username
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48)
        .padEnd(2, '0');

    const teamRepo = new TeamRepository(config.TEAM_TABLE);
    const existingSlug = await teamRepo.getBySlug(slug);
    const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug;

    const team = buildTeam({ name: `${username}'s Team`, slug: finalSlug, ownerId: userId });
    const membership = buildOwnerMembership(team.teamId, userId);

    await teamRepo.put(team);
    await membershipRepo.put(membership);

    return ok({ bootstrapped: true, teamId: team.teamId, slug: team.slug });
};

export const handler = createHandler(lambdaHandler);
