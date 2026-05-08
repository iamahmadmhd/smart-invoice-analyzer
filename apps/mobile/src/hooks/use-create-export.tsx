import { useAppDispatch, useAppSelector } from '@/store';
import {
    ExportWizardDraft,
    resetWizard,
    runCreateExport,
    runValidateExport,
    setWizardStep,
    updateWizardDraft,
    WizardStep,
} from '@/store/slices/exports-slice';
import { CreateExportRequest } from '@smart-invoice-analyzer/contracts';
import { useCallback } from 'react';

export type { WizardStep };

export function useCreateExport() {
    const dispatch = useAppDispatch();
    const {
        wizardStep,
        wizardDraft,
        validationReport,
        pendingExportBatchId,
        wizardStatus,
        wizardError,
    } = useAppSelector((s) => s.exports);

    const goToStep = useCallback((step: WizardStep) => dispatch(setWizardStep(step)), [dispatch]);

    const updateDraft = useCallback(
        (patch: Partial<ExportWizardDraft>) => dispatch(updateWizardDraft(patch)),
        [dispatch]
    );

    const validate = useCallback(async () => {
        const body = wizardDraft as CreateExportRequest;
        await dispatch(runValidateExport(body));
    }, [dispatch, wizardDraft]);

    const confirm = useCallback(async () => {
        if (!pendingExportBatchId) return;
        const body = wizardDraft as CreateExportRequest;
        await dispatch(runCreateExport({ exportBatchId: pendingExportBatchId, body }));
    }, [dispatch, pendingExportBatchId, wizardDraft]);

    const reset = useCallback(() => dispatch(resetWizard()), [dispatch]);

    const isValidating = wizardStatus === 'validating';
    const isCreating = wizardStatus === 'creating';
    const isSucceeded = wizardStatus === 'succeeded';

    const draftIsReadyForPeriod = !!wizardDraft.period;

    return {
        wizardStep,
        wizardDraft,
        validationReport,
        pendingExportBatchId,
        isValidating,
        isCreating,
        isSucceeded,
        wizardError,
        goToStep,
        updateDraft,
        validate,
        confirm,
        reset,
        draftIsReadyForPeriod,
    };
}
