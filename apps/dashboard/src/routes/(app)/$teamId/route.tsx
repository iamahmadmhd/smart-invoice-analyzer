import { createFileRoute, redirect } from '@tanstack/react-router';
import { AppShell } from '@/components/app/app-shell';

export const Route = createFileRoute('/(app)/$teamId')({
    beforeLoad({ context }) {
        if (!context.isAuthenticated) {
            throw redirect({ to: '/signin' });
        }
    },
    component: AppShell,
});
