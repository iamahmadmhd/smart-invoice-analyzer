import { useAuthStore } from '@/stores/auth';

// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env['VITE_API_URL'] as string | undefined) ?? '';

// ── Errors ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly code: string,
        message: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// ── Core fetch ────────────────────────────────────────────────────────────────

async function apiFetch<T>(
    path: string,
    options: RequestInit & { params?: Record<string, string | number | boolean | undefined> } = {}
): Promise<T> {
    const { params, ...init } = options;

    // Build URL with optional query params
    const url = new URL(`${API_BASE}${path}`);
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) {
                url.searchParams.set(key, String(value));
            }
        }
    }

    // Inject Cognito token
    const token = await useAuthStore.getState().getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(init.headers as Record<string, string> | undefined),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), { ...init, headers });

    if (!response.ok) {
        let code = 'UNKNOWN_ERROR';
        let message = `HTTP ${response.status}`;
        try {
            const body = (await response.json()) as {
                code?: string;
                error?: string;
                message?: string;
            };
            code = body.code ?? body.error ?? code;
            message = body.message ?? message;
        } catch {
            // non-JSON error body — keep defaults
        }
        throw new ApiError(response.status, code, message);
    }

    // 204 No Content
    if (response.status === 204) return undefined as T;

    return response.json() as Promise<T>;
}

// ── Convenience methods ───────────────────────────────────────────────────────

export const apiClient = {
    get<T>(
        path: string,
        params?: Record<string, string | number | boolean | undefined>
    ): Promise<T> {
        return apiFetch<T>(path, { method: 'GET', params });
    },

    post<T>(path: string, body?: unknown): Promise<T> {
        return apiFetch<T>(path, {
            method: 'POST',
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    },

    patch<T>(path: string, body?: unknown): Promise<T> {
        return apiFetch<T>(path, {
            method: 'PATCH',
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    },

    delete<T = void>(path: string): Promise<T> {
        return apiFetch<T>(path, { method: 'DELETE' });
    },
};
