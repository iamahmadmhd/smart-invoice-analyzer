import {
    assertActiveMembership,
    parseBody,
    requirePathParam,
    requireRole,
    resolveRawTeamRequest,
} from '@smart-invoice-analyzer/auth';
import { getConfig } from '@smart-invoice-analyzer/config';
import { UpdateMemberRequestSchema } from '@smart-invoice-analyzer/contracts';
import { MembershipRepository } from '@smart-invoice-analyzer/data-access';
import { assertNotLastOwner } from '@smart-invoice-analyzer/domain';
import { ApiResponse, createHandler, ParsedApiEvent } from '../powertools';
import { ok } from '../utils/response';

const lambdaHandler = async (event: ParsedApiEvent): Promise<ApiResponse> => {
    const { teamId, userId } = resolveRawTeamRequest(event);
    const targetUserId = requirePathParam(event, 'userId');
    const body = parseBody(event, UpdateMemberRequestSchema);
    const config = getConfig();

    const repo = new MembershipRepository(config.MEMBERSHIP_TABLE);
    const callerMembership = await repo.findByIds(teamId, userId);
    assertActiveMembership(callerMembership, teamId, userId);
    requireRole(callerMembership, 'ADMIN');

    if (body.role || body.status === 'SUSPENDED') {
        const all = await repo.listByTeam(teamId);
        assertNotLastOwner(all, targetUserId);
    }

    if (body.role) await repo.updateRole(teamId, targetUserId, body.role);
    if (body.status) await repo.updateStatus(teamId, targetUserId, body.status);

    return ok(await repo.getByIds(teamId, targetUserId));
};

export const handler = createHandler(lambdaHandler);
