import {
    assertActiveMembership,
    parseBody,
    requireRole,
    resolveRawTeamRequest,
} from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { CreateInvitationRequestSchema } from '@smart-invoice-analyzer/contracts';
import { InvitationRepository, MembershipRepository } from '@smart-invoice-analyzer/data-access';
import { buildInvitation } from '@smart-invoice-analyzer/domain';
import { ConflictError } from '@smart-invoice-analyzer/errors';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { created } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const body = parseBody(event, CreateInvitationRequestSchema);
    const config = getConfig();

    const callerMembership = await new MembershipRepository(config.MEMBERSHIP_TABLE).findByIds(
        teamId,
        userId
    );
    assertActiveMembership(callerMembership, teamId, userId);
    requireRole(callerMembership, 'ADMIN');

    const invitationRepo = new InvitationRepository(config.INVITATION_TABLE);
    const existing = await invitationRepo.listByTeam(teamId);
    const duplicate = existing.find((i) => i.email === body.email && i.status === 'PENDING');
    if (duplicate)
        throw new ConflictError(`A pending invitation for ${body.email} already exists`, {
            invitationId: duplicate.invitationId,
        });

    const invitation = buildInvitation({
        teamId,
        invitedByUserId: userId,
        email: body.email,
        role: body.role,
    });
    await invitationRepo.put(invitation);

    return created({
        invitationId: invitation.invitationId,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
    });
};

export const handler = createHandler(lambdaHandler);
