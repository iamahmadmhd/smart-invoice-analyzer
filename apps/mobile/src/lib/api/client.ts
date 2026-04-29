import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

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

async function getToken(): Promise<string> {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? '';
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await getToken();

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: token,
            ...options.headers,
        },
    });

    if (!response.ok) {
        let code = 'UNKNOWN_ERROR';
        let message = `HTTP ${response.status}`;
        try {
            const body = await response.json();
            code = body.error ?? code;
            message = body.message ?? message;
        } catch {
            // ignore parse error
        }
        throw new ApiError(response.status, code, message);
    }

    if (response.status === 204) return undefined as T;
    return response.json();
}
