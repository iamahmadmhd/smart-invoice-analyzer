import { ContainerScrollable } from '@/components/atoms/screen-container';
import { ExportCreateWizard } from '@/components/organisms/export-create-wizard';
import { useCreateExport } from '@/hooks/use-create-export';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';

export default function ExportCreateScreen() {
    const router = useRouter();
    const { reset } = useCreateExport();

    // Reset wizard state when screen mounts
    useEffect(() => {
        reset();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSuccess = useCallback(
        (exportBatchId: string) => {
            router.replace(`/(app)/exports/${exportBatchId}`);
        },
        [router]
    );

    return (
        <ContainerScrollable
            contentContainerClassName='pb-10 pt-4'
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
        >
            <ExportCreateWizard onSuccess={handleSuccess} />
        </ContainerScrollable>
    );
}
