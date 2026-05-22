import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/(auth)')({
    beforeLoad({ context }) {
        if (context.isAuthenticated) {
            throw redirect({
                to: '/',
            });
        }
    },
    component: AuthLayout,
});

function AuthLayout() {
    return (
        <div className='flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10'>
            <div className='w-full max-w-sm'>
                <Outlet />
            </div>
        </div>
    );
}
