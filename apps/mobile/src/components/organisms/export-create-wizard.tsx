import { useCreateExport } from '@/hooks/use-create-export';
import { ExportPeriod } from '@smart-invoice-analyzer/contracts';
import React from 'react';
import { View } from 'react-native';
import { Button } from '../atoms/button';
import { Icon } from '../atoms/icon';
import { Text } from '../atoms/text';
import { AlertBanner } from '../molecules/alert-banner';
import { DatevConfigForm, DatevConfigValues } from '../molecules/datev-config-form';
import { PeriodSelector } from '../molecules/period-selector';
import { ValidationReportCard } from '../molecules/validation-report-card';

interface StepHeaderProps {
    step: number;
    total: number;
    title: string;
    subtitle: string;
}

function StepHeader({ step, total, title, subtitle }: StepHeaderProps) {
    return (
        <View className='gap-1'>
            <View className='flex-row items-center gap-2'>
                <View className='h-6 w-6 items-center justify-center rounded-full bg-brand'>
                    <Text
                        variant='caption'
                        color='inverse'
                    >
                        {step}
                    </Text>
                </View>
                <Text
                    variant='caption'
                    color='tertiary'
                >
                    Step {step} of {total}
                </Text>
            </View>
            <Text
                variant='heading4'
                color='primary'
            >
                {title}
            </Text>
            <Text
                variant='body-small'
                color='secondary'
            >
                {subtitle}
            </Text>
        </View>
    );
}

export interface ExportCreateWizardProps {
    onSuccess: (exportBatchId: string) => void;
}

export function ExportCreateWizard({ onSuccess }: ExportCreateWizardProps) {
    const {
        wizardStep,
        wizardDraft,
        validationReport,
        isValidating,
        isCreating,
        isSucceeded,
        wizardError,
        goToStep,
        updateDraft,
        validate,
        confirm,
        draftIsReadyForPeriod,
        draftIsReadyForConfig,
        pendingExportBatchId,
    } = useCreateExport();

    React.useEffect(() => {
        if (isSucceeded && pendingExportBatchId) {
            onSuccess(pendingExportBatchId);
        }
    }, [isSucceeded, pendingExportBatchId, onSuccess]);

    return (
        <View className='gap-6'>
            {/* ── Step 1: Period ─────────────────────────────────────────── */}
            {wizardStep === 'period' && (
                <View className='gap-6'>
                    <StepHeader
                        step={1}
                        total={3}
                        title='Select period'
                        subtitle='Choose the accounting period to export invoices for.'
                    />
                    <PeriodSelector
                        value={wizardDraft.period as ExportPeriod | undefined}
                        onChange={(period) => updateDraft({ period })}
                    />
                    <Button
                        fullWidth
                        disabled={!draftIsReadyForPeriod}
                        onPress={() => goToStep('config')}
                    >
                        Continue
                    </Button>
                </View>
            )}

            {/* ── Step 2: DATEV config ───────────────────────────────────── */}
            {wizardStep === 'config' && (
                <View className='gap-6'>
                    <StepHeader
                        step={2}
                        total={3}
                        title='DATEV configuration'
                        subtitle='Enter your accounting firm details for the export header.'
                    />
                    <DatevConfigForm
                        values={wizardDraft as DatevConfigValues}
                        onChange={updateDraft}
                    />
                    {wizardError && (
                        <AlertBanner
                            variant='error'
                            message={wizardError}
                        />
                    )}
                    <View className='flex-row gap-3'>
                        <Button
                            variant='secondary'
                            onPress={() => goToStep('period')}
                            className='flex-1'
                        >
                            Back
                        </Button>
                        <Button
                            loading={isValidating}
                            disabled={!draftIsReadyForConfig}
                            onPress={validate}
                            className='flex-1'
                        >
                            Validate
                        </Button>
                    </View>
                </View>
            )}

            {/* ── Step 3: Confirm ────────────────────────────────────────── */}
            {wizardStep === 'confirm' && validationReport && (
                <View className='gap-6'>
                    <StepHeader
                        step={3}
                        total={3}
                        title='Review & confirm'
                        subtitle='Check the validation report before generating your export.'
                    />
                    <ValidationReportCard report={validationReport} />

                    {wizardError && (
                        <AlertBanner
                            variant='error'
                            message={wizardError}
                        />
                    )}

                    <View className='flex-row gap-3'>
                        <Button
                            variant='secondary'
                            onPress={() => goToStep('config')}
                            className='flex-1'
                        >
                            Back
                        </Button>
                        <Button
                            loading={isCreating}
                            disabled={!validationReport.canProceed}
                            onPress={confirm}
                            className='flex-1'
                        >
                            Generate
                        </Button>
                    </View>

                    {!validationReport.canProceed && (
                        <View className='flex-row items-center gap-2'>
                            <Icon
                                name='info'
                                size={14}
                                color='tertiary'
                            />
                            <Text
                                variant='caption'
                                color='tertiary'
                            >
                                Fix errors in the affected invoices before generating the export.
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}
