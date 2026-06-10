import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ResetPasswordPage } from '@/features/auth';

const searchSchema = z.object({ email: z.email().default('') });

export const Route = createFileRoute('/(auth)/reset-password')({
    validateSearch: searchSchema,
    component: ResetPasswordPage,
});
