export interface ApiResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}

const baseHeaders = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
};

export function ok(data: unknown): ApiResponse {
    return { statusCode: 200, headers: baseHeaders, body: JSON.stringify(data) };
}

export function created(data: unknown): ApiResponse {
    return { statusCode: 201, headers: baseHeaders, body: JSON.stringify(data) };
}

export function noContent(): ApiResponse {
    return { statusCode: 204, headers: baseHeaders, body: '' };
}

export function badRequest(message: string): ApiResponse {
    return {
        statusCode: 400,
        headers: baseHeaders,
        body: JSON.stringify({ error: 'BAD_REQUEST', message }),
    };
}

export function notFound(message: string): ApiResponse {
    return {
        statusCode: 404,
        headers: baseHeaders,
        body: JSON.stringify({ error: 'NOT_FOUND', message }),
    };
}
