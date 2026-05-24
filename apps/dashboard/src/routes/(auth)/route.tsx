import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { GridPattern } from '@/components/ui/grid-pattern';
import { cn } from '@/lib/utils';

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
            <GridPattern
                width={80}
                height={80}
                x={-1}
                y={-1}
                strokeDasharray={'4 2'}
                className={cn(
                    '[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]'
                )}
            />
            <div className='w-full max-w-md'>
                <Outlet />
            </div>
        </div>
    );
}
