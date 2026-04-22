import { z } from 'zod';

export const signInSchema = z.object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z
    .object({
        email: z.string().email('Enter a valid email address'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain an uppercase letter')
            .regex(/\d/, 'Password must contain a number'),
        confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export type SignInFields = z.infer<typeof signInSchema>;
export type SignUpFields = z.infer<typeof signUpSchema>;

// ─── Helper ───────────────────────────────────────────────────────────────────
// Receives result.error (a ZodError) and returns a typed { field: message }
// record keyed to the schema's own field names.

export function flattenZodErrors<T>(
    error: z.ZodError<T>
): Partial<Record<keyof T & string, string>> {
    return Object.fromEntries(error.errors.map((e) => [e.path.join('.'), e.message])) as Partial<
        Record<keyof T & string, string>
    >;
}
