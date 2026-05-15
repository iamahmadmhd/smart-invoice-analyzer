import { randomBytes } from 'crypto';
import {
    Invitation,
    MemberRole,
    Membership,
    ROLE_ORDER,
    Team,
    TeamPlan,
} from '@smart-invoice-analyzer/contracts';
import { ConflictError } from '@smart-invoice-analyzer/errors';
import { addDays } from 'date-fns';
import { generateInvitationId, generateTeamId } from './invoice-id';

const INVITATION_TTL_DAYS = 7;

export interface CreateTeamInput {
    name: string;
    slug: string;
    ownerId: string;
    plan?: TeamPlan;
}

export function buildTeam(input: CreateTeamInput): Team {
    const now = new Date().toISOString();
    return {
        teamId: generateTeamId(),
        name: input.name,
        slug: input.slug,
        ownerId: input.ownerId,
        plan: input.plan ?? 'free',
        createdAt: now,
        updatedAt: now,
    };
}

export function buildOwnerMembership(teamId: string, userId: string): Membership {
    return { teamId, userId, role: 'OWNER', status: 'ACTIVE', joinedAt: new Date().toISOString() };
}

export function buildMembership(teamId: string, userId: string, role: MemberRole): Membership {
    return { teamId, userId, role, status: 'ACTIVE', joinedAt: new Date().toISOString() };
}

export interface CreateInvitationInput {
    teamId: string;
    invitedByUserId: string;
    email: string;
    role: MemberRole;
}

export function buildInvitation(input: CreateInvitationInput): Invitation {
    const now = new Date();
    return {
        invitationId: generateInvitationId(),
        teamId: input.teamId,
        invitedByUserId: input.invitedByUserId,
        email: input.email,
        role: input.role,
        token: randomBytes(32).toString('hex'),
        status: 'PENDING',
        expiresAt: addDays(now, INVITATION_TTL_DAYS).toISOString(),
        createdAt: now.toISOString(),
    };
}

export function isInvitationExpired(invitation: Invitation): boolean {
    return new Date() > new Date(invitation.expiresAt);
}

export function hasRole(membership: Membership, minRole: MemberRole): boolean {
    return ROLE_ORDER[membership.role] >= ROLE_ORDER[minRole];
}

export function isOwner(membership: Membership): boolean {
    return membership.role === 'OWNER';
}

export function assertNotLastOwner(members: Membership[], targetUserId: string): void {
    const owners = members.filter((m) => m.role === 'OWNER' && m.status === 'ACTIVE');
    if (owners.length === 1 && owners[0]!.userId === targetUserId) {
        throw new ConflictError(
            'Cannot remove or demote the last owner of a team. Transfer ownership first.'
        );
    }
}
