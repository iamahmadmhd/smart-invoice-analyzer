import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

// Set up a Router instance
export const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    context: {
        isAuthenticated: undefined!,
    },
});

// Register things for typesafety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
