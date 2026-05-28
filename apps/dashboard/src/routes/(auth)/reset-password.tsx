import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ResetPasswordPage } from '@/components/auth/reset-password-page';

const searchSchema = z.object({ email: z.string().default('') });

export const Route = createFileRoute('/(auth)/reset-password')({
    validateSearch: searchSchema,
    component: ResetPasswordPage,
});
