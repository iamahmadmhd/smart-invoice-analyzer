import { useQuery } from '@tanstack/react-query';

export function createTeamResourceHook<T, Q = void>(
    resourceName: string,
    fetcher: (teamId: string, query?: Q) => Promise<T>,
    options: { staleTime?: number } = {}
) {
    return function(teamId: string | null, query?: Q) {
        return useQuery({
            queryKey: [resourceName, teamId, query],
            queryFn: () => fetcher(teamId!, query),
            enabled: !!teamId,
            staleTime: options.staleTime ?? 30_000,
        });
    };
}