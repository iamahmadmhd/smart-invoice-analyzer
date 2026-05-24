import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { router } from './router';
import { configureAmplify } from '@/lib/amplify';
import { useAuthStore } from '@/stores/auth';
import { PageLoader } from '@/components/ui/page-loader';
import { queryClient } from '@/lib/query-client';
import './styles.css';

configureAmplify();

function App() {
    const initialize = useAuthStore((s) => s.initialize);
    const isInitialized = useAuthStore((s) => s.isInitialized);
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        initialize();
    }, [initialize]);

    if (!isInitialized) {
        return <PageLoader />;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider
                router={router}
                context={{ isAuthenticated: !!user }}
            />
        </QueryClientProvider>
    );
}

const rootElement = document.getElementById('app')!;

if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
