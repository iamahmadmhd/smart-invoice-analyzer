import { downloadExport } from '@/lib/api/exports';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchExportDetail } from '@/store/slices/exports-slice';
import { useCallback, useEffect, useRef } from 'react';

const POLL_INTERVAL_MS = 4000;
const TERMINAL_STATUSES = ['COMPLETED', 'FAILED'];

export function useExportDetail(exportBatchId: string) {
    const dispatch = useAppDispatch();
    const { currentBatch, detailStatus, detailError } = useAppSelector((s) => s.exports);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetch = useCallback(() => {
        if (exportBatchId) dispatch(fetchExportDetail(exportBatchId));
    }, [dispatch, exportBatchId]);

    // Initial fetch
    useEffect(() => {
        fetch();
    }, [fetch]);

    // Polling while non-terminal
    useEffect(() => {
        const status = currentBatch?.status;
        const isForThisBatch = currentBatch?.exportBatchId === exportBatchId;

        if (isForThisBatch && status && !TERMINAL_STATUSES.includes(status)) {
            pollRef.current = setInterval(fetch, POLL_INTERVAL_MS);
        } else {
            if (pollRef.current) clearInterval(pollRef.current);
        }

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [currentBatch?.status, currentBatch?.exportBatchId, exportBatchId, fetch]);

    const handleDownload = useCallback(async () => {
        if (!exportBatchId) return null;
        try {
            return await downloadExport(exportBatchId);
        } catch {
            return null;
        }
    }, [exportBatchId]);

    return {
        batch: currentBatch?.exportBatchId === exportBatchId ? currentBatch : null,
        loading: detailStatus === 'loading',
        error: detailError,
        refresh: fetch,
        download: handleDownload,
    };
}
