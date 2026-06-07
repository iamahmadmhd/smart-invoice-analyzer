import { createFileRoute, redirect } from '@tanstack/react-router';
import { AppShell } from '@/components/layouts';

export const Route = createFileRoute('/(app)/$teamId')({
    beforeLoad({ context }) {
        if (!context.isAuthenticated) {
            throw redirect({ to: '/signin' });
        }
    },
    component: AppShell,
});
