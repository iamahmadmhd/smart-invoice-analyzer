import { useQuery } from '@tanstack/react-query';

export function createTeamResourceHook<TData, TQuery = void>(
    resourceName: string,
    fetcher: (teamId: string, query?: TQuery) => Promise<TData>,
    options: { staleTime?: number } = {}
) {
    return function (teamId: string | null, query?: TQuery) {
        return useQuery({
            queryKey: [resourceName, teamId, query],
            queryFn: () => fetcher(teamId!, query),
            enabled: !!teamId,
            staleTime: options.staleTime ?? 30_000,
        });
    };
}
