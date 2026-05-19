import { Loader } from '@/components/ui/loader';
import { configureAmplify } from '@/lib/amplify';
import { useAuthStore } from '@/stores/auth';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { useEffect, useState } from 'react';
import appCss from '../styles.css?url';

configureAmplify();

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: 1,
        },
    },
});

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { charSet: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { title: 'Smart Invoice Analyzer' },
        ],
        links: [{ rel: 'stylesheet', href: appCss }],
    }),
    component: RootDocument,
});

function RootDocument() {
    return (
        <html
            lang='en'
            className='dark'
        >
            <head>
                <HeadContent />
            </head>
            <body>
                <QueryClientProvider client={queryClient}>
                    <AuthGate />
                </QueryClientProvider>
                <TanStackDevtools
                    config={{ position: 'bottom-right' }}
                    plugins={[{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }]}
                />
                <Scripts />
            </body>
        </html>
    );
}

/**
 * Initializes the auth store before rendering any route.
 * Shows nothing until we know whether the user is logged in,
 * preventing a flash of the sign-in page for authenticated users.
 */
function AuthGate() {
    const initialize = useAuthStore((s) => s.initialize);
    const isInitialized = useAuthStore((s) => s.isInitialized);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        initialize().finally(() => setReady(true));
    }, [initialize]);

    if (!ready || !isInitialized) {
        return (
            <div className='flex min-h-svh items-center justify-center'>
                <Loader
                    size={48}
                    animateOnView
                />
            </div>
        );
    }

    return <Outlet />;
}
