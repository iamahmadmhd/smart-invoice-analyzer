import { apiClient } from '#/lib/api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Team {
    teamId: string;
    name: string;
    slug: string;
    ownerId: string;
    plan: 'free' | 'pro';
    role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
    createdAt: string;
    updatedAt: string;
}

export type BootstrapResult =
    | { bootstrapped: true; teamId: string; slug: string }
    | { bootstrapped: false; teams: Array<string> };

// ── API calls ─────────────────────────────────────────────────────────────────

export async function bootstrap(): Promise<BootstrapResult> {
    return apiClient.post<BootstrapResult>('/bootstrap');
}

export async function listTeams(): Promise<Array<Team>> {
    const res = await apiClient.get<{ teams: Array<Team>; total: number }>('/teams');
    return res.teams;
}

export async function createTeam(
    name: string,
    slug: string
): Promise<{ teamId: string; slug: string }> {
    return apiClient.post('/teams', { name, slug });
}
