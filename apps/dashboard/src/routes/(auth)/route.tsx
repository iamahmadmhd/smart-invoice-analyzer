import { useAuthStore } from '@/stores/auth';
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/(auth)')({
    component: AuthLayout,
});

function AuthLayout() {
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) navigate({ to: '/' });
    }, [user, navigate]);

    return (
        <div className='bg-canvas to-canvas dark:bg-night dark:from-night-subtle dark:to-night flex min-h-svh flex-col items-center justify-center gap-6 bg-radial from-canvas-inset p-6 md:p-10'>
            <div className='w-full max-w-sm'>
                <Outlet />
            </div>
        </div>
    );
}
