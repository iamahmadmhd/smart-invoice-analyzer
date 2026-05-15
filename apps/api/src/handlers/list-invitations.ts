import {
    assertActiveMembership,
    requireRole,
    resolveRawTeamRequest,
} from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { InvitationRepository, MembershipRepository } from '@smart-invoice-analyzer/data-access';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const config = getConfig();

    const membership = await new MembershipRepository(config.MEMBERSHIP_TABLE).findByIds(
        teamId,
        userId
    );
    assertActiveMembership(membership, teamId, userId);
    requireRole(membership, 'ADMIN');

    const invitations = await new InvitationRepository(config.INVITATION_TABLE).listByTeam(teamId);
    return ok({ invitations, total: invitations.length });
};

export const handler = createHandler(lambdaHandler);
