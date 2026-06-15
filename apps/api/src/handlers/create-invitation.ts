import { assertActiveMembership, parseBody, requireRole, resolveRawTeamRequest } from '@vault/auth';
import { getConfig } from '@vault/config';
import { CreateInvitationRequestSchema } from '@vault/contracts';
import { InvitationRepository, MembershipRepository } from '@vault/data-access';
import { buildInvitation } from '@vault/domain';
import { ConflictError } from '@vault/errors';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { created } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const body = parseBody(event, CreateInvitationRequestSchema);
    const config = getConfig();

    const callerMembership = await new MembershipRepository(config.MEMBERSHIP_TABLE!).findByIds(
        teamId,
        userId
    );
    assertActiveMembership(callerMembership, teamId, userId);
    requireRole(callerMembership, 'ADMIN');

    const invitationRepo = new InvitationRepository(config.INVITATION_TABLE!);
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
