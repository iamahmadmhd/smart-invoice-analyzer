import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { router } from './router';
import { configureAmplify } from '@/lib/amplify';
import { PageLoader } from '@/components/ui/page-loader';
import { queryClient } from '@/lib/query-client';
import { authQueryOptions } from '@/lib/auth-query';
import './styles.css';

configureAmplify();

function AuthGate() {
    const { data: user, isLoading } = useQuery(authQueryOptions);

    if (isLoading) return <PageLoader />;

    return (
        <RouterProvider
            router={router}
            context={{ isAuthenticated: !!user }}
        />
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthGate />
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
