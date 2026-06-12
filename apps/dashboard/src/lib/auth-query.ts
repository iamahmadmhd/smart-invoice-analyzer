import { queryOptions } from '@tanstack/react-query';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';

export const authQueryOptions = queryOptions({
    queryKey: ['auth-user'],
    queryFn: async () => {
        const user = await getCurrentUser();
        const session = await fetchAuthSession();
        const claims = session.tokens?.idToken?.payload;
        return {
            userId: user.userId,
            email: claims?.['email'] as string,
            username: user.username,
        };
    },
    retry: false,
    staleTime: Infinity,
});
