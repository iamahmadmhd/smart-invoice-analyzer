import { assertActiveMembership, requireRole, resolveRawTeamRequest } from '@vault/auth';
import { getConfig } from '@vault/config';
import { InvitationRepository, MembershipRepository } from '@vault/data-access';
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
    requireRole(membership, 'ADMIN');

    const invitations = await new InvitationRepository(config.INVITATION_TABLE!).listByTeam(teamId);
    return ok({ invitations, total: invitations.length });
};

export const handler = createHandler(lambdaHandler);
