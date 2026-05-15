import { MemberRole, Membership, ROLE_ORDER } from '@smart-invoice-analyzer/contracts';
import { NotFoundError } from '@smart-invoice-analyzer/errors';
import { getUserContext, ParsedApiEvent, requirePathParam, UnauthorizedError } from './cognito';

export interface TeamContext {
    teamId: string;
    userId: string;
    membership: Membership;
}

export interface RawTeamRequest {
    teamId: string;
    userId: string;
}

export function requireTeamPathParam(event: ParsedApiEvent): string {
    return requirePathParam(event, 'teamId');
}

export function resolveRawTeamRequest(event: ParsedApiEvent): RawTeamRequest {
    const { userId } = getUserContext(event);
    const teamId = requireTeamPathParam(event);
    return { teamId, userId };
}

export function assertActiveMembership(
    membership: Membership | null,
    teamId: string,
    userId: string
): asserts membership is Membership {
    if (!membership || membership.status !== 'ACTIVE') {
        // 404 to avoid leaking whether the team exists
        throw new NotFoundError('Team', teamId);
    }
}

export function requireRole(membership: Membership, minRole: MemberRole): void {
    if (ROLE_ORDER[membership.role] < ROLE_ORDER[minRole]) {
        throw new ForbiddenError(
            `This action requires the ${minRole} role or higher (current: ${membership.role})`
        );
    }
}

export class ForbiddenError extends UnauthorizedError {
    constructor(message = 'Forbidden') {
        super(message);
        this.name = 'ForbiddenError';
        Object.defineProperty(this, 'statusCode', { value: 403 });
    }
}
