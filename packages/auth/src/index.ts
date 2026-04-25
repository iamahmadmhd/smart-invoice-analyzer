import { z } from 'zod';

// ── Cognito JWT claims ────────────────────────────────────────────────────────
// API Gateway with a Cognito authorizer injects the decoded claims into
// event.requestContext.authorizer.claims — no signature verification needed
// at the Lambda level (API Gateway already verified the token).

const cognitoClaimsSchema = z.object({
    sub: z.string().min(1),
    email: z.string().email(),
    'cognito:username': z.string().optional(),
    email_verified: z
        .union([z.boolean(), z.string()])
        .transform((v) => v === true || v === 'true')
        .optional(),
    iat: z.coerce.number().optional(),
    exp: z.coerce.number().optional(),
});

export type CognitoClaims = z.infer<typeof cognitoClaimsSchema>;

// ── User context ──────────────────────────────────────────────────────────────
// Canonical user object passed through the app layer.

export interface UserContext {
    /** DynamoDB userId — same as Cognito sub */
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
        throw new UnauthorizedError('Invalid authorizer claims');
    }

    return result.data;
}

// ── User context builder ──────────────────────────────────────────────────────

export function getUserContext(event: AuthorizedEvent): UserContext {
    const claims = extractClaims(event);

    return {
        userId: claims.sub,
        email: claims.email,
        username: claims['cognito:username'] ?? claims.email,
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

// ── Local error classes (avoiding circular dep with observability) ────────────

export class UnauthorizedError extends Error {
    readonly code = 'UNAUTHORIZED';
    readonly statusCode = 401;

    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

export class ValidationError extends Error {
    readonly code = 'VALIDATION_ERROR';
    readonly statusCode = 400;

    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}
