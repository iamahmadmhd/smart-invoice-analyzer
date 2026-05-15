import { getUserContext } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { MembershipRepository, TeamRepository } from '@smart-invoice-analyzer/data-access';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { userId } = getUserContext(event);
    const config = getConfig();

    const memberships = await new MembershipRepository(config.MEMBERSHIP_TABLE).listByUser(userId);
    const active = memberships.filter((m) => m.status === 'ACTIVE');
    const teams = await Promise.all(
        active.map((m) => new TeamRepository(config.TEAM_TABLE).getById(m.teamId))
    );

    return ok({
        teams: teams.map((t, i) => ({ ...t, role: active[i]!.role })),
        total: teams.length,
    });
};

export const handler = createHandler(lambdaHandler);
