import { createFileRoute, redirect } from '@tanstack/react-router';
import { AuthLayout } from '@/features/auth';

export const Route = createFileRoute('/(auth)')({
    beforeLoad({ context }) {
        if (context.isAuthenticated) {
            throw redirect({ to: '/' });
        }
    },
    component: AuthLayout,
});
