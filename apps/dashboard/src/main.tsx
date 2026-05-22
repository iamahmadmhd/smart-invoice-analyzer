import { RouterProvider } from '@tanstack/react-router';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Loader } from './components/ui/loader';
import { configureAmplify } from './lib/amplify';
import { router } from './router';
import { useAuthStore } from './stores/auth';
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
        return (
            <div className='flex min-h-svh items-center justify-center'>
                <Loader
                    size={48}
                    animateOnView
                />
            </div>
        );
    }

    return (
        <RouterProvider
            router={router}
            context={{ isAuthenticated: !!user }}
        />
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
