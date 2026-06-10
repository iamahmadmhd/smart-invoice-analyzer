import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-client';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Don't hammer the API on every focus event
            staleTime: 30_000,
            // Surface errors rather than swallowing them
            throwOnError: false,
            // Retry non-client errors only (skip 4xx)
            retry: (failureCount, error) => {
                if (error instanceof ApiError && error.status < 500) return false;
                return failureCount < 2;
            },
        },
        mutations: {
            // Let mutation errors bubble to the call site
            throwOnError: false,
        },
    },
});
