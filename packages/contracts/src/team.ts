import { z } from 'zod';

// ── Enums ─────────────────────────────────────────────────────────────────────

export const TeamPlanSchema = z.enum(['free', 'pro']);
export type TeamPlan = z.infer<typeof TeamPlanSchema>;

export const MemberRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);
export type MemberRole = z.infer<typeof MemberRoleSchema>;

// Role ordering — higher index = more permissions
export const ROLE_ORDER: Record<MemberRole, number> = {
    VIEWER: 0,
    MEMBER: 1,
    ADMIN: 2,
    OWNER: 3,
};

export const MembershipStatusSchema = z.enum(['ACTIVE', 'SUSPENDED']);
export type MembershipStatus = z.infer<typeof MembershipStatusSchema>;

export const InvitationStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED']);
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

// ── Slug validation ───────────────────────────────────────────────────────────

const slugSchema = z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Slug must be lowercase alphanumeric with hyphens');

// ── Domain entities ───────────────────────────────────────────────────────────

export const TeamSchema = z.object({
    teamId: z.string().min(1),
    name: z.string().min(1).max(100),
    slug: slugSchema,
    ownerId: z.string().min(1),
    plan: TeamPlanSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type Team = z.infer<typeof TeamSchema>;

export const MembershipSchema = z.object({
    teamId: z.string().min(1),
    userId: z.string().min(1),
    role: MemberRoleSchema,
    status: MembershipStatusSchema,
    joinedAt: z.string(),
});
export type Membership = z.infer<typeof MembershipSchema>;

export const InvitationSchema = z.object({
    invitationId: z.string().min(1),
    teamId: z.string().min(1),
    invitedByUserId: z.string().min(1),
    email: z.email(),
    role: MemberRoleSchema,
    token: z.string().min(1),
    status: InvitationStatusSchema,
    expiresAt: z.string(),
    createdAt: z.string(),
});
export type Invitation = z.infer<typeof InvitationSchema>;

// ── Request / response DTOs ───────────────────────────────────────────────────

export const CreateTeamRequestSchema = z.object({
    name: z.string().min(1).max(100),
    slug: slugSchema,
});
export type CreateTeamRequest = z.infer<typeof CreateTeamRequestSchema>;

export const UpdateTeamRequestSchema = z.object({
    name: z.string().min(1).max(100).optional(),
});
export type UpdateTeamRequest = z.infer<typeof UpdateTeamRequestSchema>;

// OWNER role cannot be assigned via invitation — ownership transfers are a separate flow
export const CreateInvitationRequestSchema = z.object({
    email: z.email(),
    role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
});
export type CreateInvitationRequest = z.infer<typeof CreateInvitationRequestSchema>;

export const UpdateMemberRequestSchema = z.object({
    // Cannot promote/demote to OWNER via this endpoint
    role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).optional(),
    status: MembershipStatusSchema.optional(),
});
export type UpdateMemberRequest = z.infer<typeof UpdateMemberRequestSchema>;

export const ListMembersResponseSchema = z.object({
    members: z.array(MembershipSchema),
    total: z.number(),
});
export type ListMembersResponse = z.infer<typeof ListMembersResponseSchema>;

export const ListInvitationsResponseSchema = z.object({
    invitations: z.array(InvitationSchema),
    total: z.number(),
});
export type ListInvitationsResponse = z.infer<typeof ListInvitationsResponseSchema>;
