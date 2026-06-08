import { createFileRoute } from '@tanstack/react-router';
import { SignInPage } from '@/features/auth';

export const Route = createFileRoute('/(auth)/signin')({
    component: SignInPage,
});
