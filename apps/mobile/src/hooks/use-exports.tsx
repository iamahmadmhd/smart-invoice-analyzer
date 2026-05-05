import { useAppDispatch, useAppSelector } from '@/store';
import { fetchExports } from '@/store/slices/exports-slice';
import { useCallback, useEffect } from 'react';

export function useExports() {
    const dispatch = useAppDispatch();
    const { items, listStatus, listError } = useAppSelector((s) => s.exports);

    useEffect(() => {
        if (listStatus === 'idle') dispatch(fetchExports());
    }, [dispatch, listStatus]);

    const refresh = useCallback(() => {
        dispatch(fetchExports());
    }, [dispatch]);

    return {
        exports: items,
        loading: listStatus === 'loading',
        error: listError,
        refresh,
    };
}
