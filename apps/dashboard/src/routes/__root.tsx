import { TanStackDevtools } from '@tanstack/react-devtools';
import { HeadContent, Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { Fragment } from 'react';

interface RouterContext {
    isAuthenticated: boolean;
}

export const Route = createRootRouteWithContext<RouterContext>()({
    head: () => ({
        meta: [
            { charSet: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { title: 'Vault' },
        ],
    }),
    component: RootComponent,
});

function RootComponent() {
    return (
        <Fragment>
            <HeadContent />
            <Outlet />
            <TanStackDevtools
                config={{
                    position: 'bottom-right',
                }}
                plugins={[
                    {
                        name: 'TanStack Router',
                        render: <TanStackRouterDevtoolsPanel />,
                    },
                ]}
            />
        </Fragment>
    );
}
