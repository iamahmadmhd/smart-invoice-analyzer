import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { presignUpload, uploadToS3, createInvoice } from '@/lib/api/upload';
import {
    selectFile,
    startUpload,
    setProgress,
    startCreating,
    startProcessing,
    uploadDone,
    uploadError,
    reset,
    SelectedFile,
} from '@/store/slices/upload-slice';
import { prependInvoice } from '@/store/slices/invoices-slice';

export function useUpload() {
    const dispatch = useAppDispatch();
    const uploadState = useAppSelector((s) => s.upload);

    const pickFile = useCallback(
        (file: SelectedFile) => {
            dispatch(selectFile(file));
        },
        [dispatch]
    );

    const startUploadFlow = useCallback(async () => {
        const { file } = uploadState;
        if (!file) return;

        try {
            dispatch(startUpload());

            // 1. Get presigned URL
            const { uploadUrl, fileObjectId } = await presignUpload(
                file.name,
                file.contentType,
                file.size
            );

            // 2. Upload file to S3 with progress
            const blob = await fetch(file.uri).then((r) => r.blob());
            await uploadToS3(uploadUrl, blob, file.contentType, (pct) => {
                dispatch(setProgress(pct));
            });

            // 3. Create invoice record
            dispatch(startCreating());
            const { invoiceId } = await createInvoice(fileObjectId, file.name, file.contentType);

            // 4. Mark as processing and add placeholder to list
            dispatch(startProcessing(invoiceId));
            dispatch(
                prependInvoice({
                    invoiceId,
                    userId: '',
                    sourceFileId: fileObjectId,
                    status: 'UPLOADED',
                    exportStatus: 'NOT_EXPORTED',
                    currency: 'EUR',
                    duplicateFlag: false,
                    anomalyFlag: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                })
            );

            dispatch(uploadDone());
        } catch (e: any) {
            dispatch(uploadError(e.message ?? 'Upload failed'));
        }
    }, [dispatch, uploadState]);

    const resetUpload = useCallback(() => {
        dispatch(reset());
    }, [dispatch]);

    return {
        ...uploadState,
        pickFile,
        startUploadFlow,
        resetUpload,
    };
}
