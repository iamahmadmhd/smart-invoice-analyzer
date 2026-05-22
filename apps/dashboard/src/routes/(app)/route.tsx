import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/(app)')({
    beforeLoad({ context, location }) {
        if (!context.isAuthenticated) {
            throw redirect({
                to: '/signin',
                search: {
                    redirect: location.href,
                },
            });
        }
    },
    component: () => <Outlet />,
});
