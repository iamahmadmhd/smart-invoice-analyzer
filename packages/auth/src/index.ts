import { AppError } from '@smart-invoice-analyzer/observability';
import { z } from 'zod';

// ── Cognito JWT claims ────────────────────────────────────────────────────────
// API Gateway injects all claims as strings — even booleans and numbers.
// We only parse the three fields getUserContext actually reads; everything
// else (iss, aud, exp, iat, token_use, …) is ignored via .passthrough().

const cognitoClaimsSchema = z
    .object({
        sub: z.string().min(1),
        email: z.string().optional(),
        'cognito:username': z.string().optional(),
    })
    .catchall(z.unknown());

export type CognitoClaims = z.infer<typeof cognitoClaimsSchema>;

// ── User context ──────────────────────────────────────────────────────────────

export interface UserContext {
    userId: string;
    email: string;
    username: string;
}

// ── API Gateway event shapes ──────────────────────────────────────────────────

export interface AuthorizedEvent {
    requestContext: {
        requestId: string;
        authorizer: {
            claims: Record<string, string>;
        };
    };
    headers?: Record<string, string | undefined>;
    httpMethod?: string;
    path?: string;
    pathParameters?: Record<string, string | undefined> | null;
    queryStringParameters?: Record<string, string | undefined> | null;
    body?: string | null;
}

// ── Claim extraction ──────────────────────────────────────────────────────────

export function extractClaims(event: AuthorizedEvent): CognitoClaims {
    const raw = event.requestContext?.authorizer?.claims;

    if (!raw) {
        throw new UnauthorizedError('Missing authorizer claims');
    }

    const result = cognitoClaimsSchema.safeParse(raw);

    if (!result.success) {
        const receivedKeys = Object.keys(raw).join(', ');
        const zodIssues = result.error.issues
            .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
            .join('; ');
        throw new UnauthorizedError(
            `Invalid authorizer claims — keys: [${receivedKeys}] — issues: ${zodIssues}`
        );
    }

    return result.data;
}

// ── User context builder ──────────────────────────────────────────────────────

export function getUserContext(event: AuthorizedEvent): UserContext {
    const claims = extractClaims(event);

    return {
        userId: claims.sub,
        email: claims.email ?? claims['cognito:username'] ?? claims.sub,
        username: claims['cognito:username'] ?? claims.email ?? claims.sub,
    };
}

// ── Path / query param helpers ────────────────────────────────────────────────

export function requirePathParam(event: AuthorizedEvent, name: string): string {
    const value = event.pathParameters?.[name];
    if (!value) {
        throw new ValidationError(`Missing path parameter: ${name}`);
    }
    return value;
}

export function getQueryParam(event: AuthorizedEvent, name: string): string | undefined {
    return event.queryStringParameters?.[name] ?? undefined;
}

export function parseBody<T>(event: AuthorizedEvent, schema: z.ZodType<T>): T {
    if (!event.body) {
        throw new ValidationError('Request body is required');
    }

    let raw: unknown;
    try {
        raw = JSON.parse(event.body);
    } catch {
        throw new ValidationError('Request body must be valid JSON');
    }

    const result = schema.safeParse(raw);
    if (!result.success) {
        const issues = result.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join(', ');
        throw new ValidationError(`Invalid request body: ${issues}`);
    }

    return result.data;
}

// ── Error classes ─────────────────────────────────────────────────────────────

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 'UNAUTHORIZED', 401);
        this.name = 'UnauthorizedError';
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR', 400);
        this.name = 'ValidationError';
    }
}
