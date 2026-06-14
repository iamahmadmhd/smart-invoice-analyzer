import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { SignInPage } from '@/features/auth';

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute('/(auth)/signin')({
    validateSearch: searchSchema,
    component: SignInPage,
});
