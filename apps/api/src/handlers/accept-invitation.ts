import { getUserContext, parseBody } from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { InvitationRepository, MembershipRepository } from '@smart-invoice-analyzer/data-access';
import { buildMembership, isInvitationExpired } from '@smart-invoice-analyzer/domain';
import { ConflictError, NotFoundError } from '@smart-invoice-analyzer/errors';
import { z } from 'zod';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';

const AcceptBodySchema = z.object({ token: z.string().min(1) });

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { userId } = getUserContext(event);
    const { token } = parseBody(event, AcceptBodySchema);
    const config = getConfig();

    const invitationRepo = new InvitationRepository(config.INVITATION_TABLE);
    const invitation = await invitationRepo.getByToken(token);

    if (!invitation) throw new NotFoundError('Invitation', token);
    if (invitation.status !== 'PENDING')
        throw new ConflictError(
            `Invitation is ${invitation.status.toLowerCase()} and cannot be accepted`
        );
    if (isInvitationExpired(invitation)) {
        await invitationRepo.updateStatus(invitation.teamId, invitation.invitationId, 'EXPIRED');
        throw new ConflictError('Invitation has expired');
    }

    const membershipRepo = new MembershipRepository(config.MEMBERSHIP_TABLE);
    const existing = await membershipRepo.findByIds(invitation.teamId, userId);
    if (existing) throw new ConflictError('You are already a member of this team');

    await membershipRepo.put(buildMembership(invitation.teamId, userId, invitation.role));
    await invitationRepo.updateStatus(invitation.teamId, invitation.invitationId, 'ACCEPTED');

    return ok({ teamId: invitation.teamId, role: invitation.role });
};

export const handler = createHandler(lambdaHandler);
