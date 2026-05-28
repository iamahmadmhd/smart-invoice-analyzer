import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ConfirmPage } from '@/components/auth/confirm-page';

const searchSchema = z.object({ email: z.string().default('') });

export const Route = createFileRoute('/(auth)/confirm')({
    validateSearch: searchSchema,
    component: ConfirmPage,
});
