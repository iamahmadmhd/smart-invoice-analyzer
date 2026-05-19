import { useAuthStore } from '@/stores/auth';
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/(app)')({
    component: AppLayout,
});

function AppLayout() {
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) navigate({ to: '/signin' });
    }, [user, navigate]);

    if (!user) return null;

    return <Outlet />;
}
