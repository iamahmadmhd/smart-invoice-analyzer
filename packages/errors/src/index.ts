// ── Base error ────────────────────────────────────────────────────────────────

export class AppError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode: number = 500,
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'AppError';
    }
}

// ── Derived errors ────────────────────────────────────────────────────────────

export class NotFoundError extends AppError {
    constructor(resource: string, id: string) {
        super(`${resource} not found: ${id}`, 'NOT_FOUND', 404, { resource, id });
        this.name = 'NotFoundError';
    }
}

export class ValidationError extends AppError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, 'VALIDATION_ERROR', 400, context);
        this.name = 'ValidationError';
    }
}

export class ConflictError extends AppError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, 'CONFLICT', 409, context);
        this.name = 'ConflictError';
    }
}

// ── Serialisation helper (used by API handler wrapper) ────────────────────────

export function serializeError(error: unknown): Record<string, unknown> {
    if (error instanceof AppError) {
        return {
            name: error.name,
            code: error.code,
            message: error.message,
            statusCode: error.statusCode,
            context: error.context,
        };
    }
    if (error instanceof Error) {
        return { name: error.name, message: error.message, stack: error.stack };
    }
    return { raw: String(error) };
}
