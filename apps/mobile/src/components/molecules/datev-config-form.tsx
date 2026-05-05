import { ExportWizardDraft } from '@/store/slices/exports-slice';
import { Sachkontenrahmen } from '@smart-invoice-analyzer/contracts';
import React from 'react';
import { View } from 'react-native';
import { Chip } from '../atoms/chip';
import { Text } from '../atoms/text';
import { FormField } from './form-field';

export interface DatevConfigFormProps {
    values: Partial<ExportWizardDraft>;
    onChange: (patch: Partial<ExportWizardDraft>) => void;
}

const SKR_OPTIONS: { value: Sachkontenrahmen; label: string; description: string }[] = [
    { value: 'SKR03', label: 'SKR03', description: 'Standard / Handelsunternehmen' },
    { value: 'SKR04', label: 'SKR04', description: 'Industrie / Gewerbe' },
];

const KONTO_LENGTHS = [4, 5, 6, 7, 8];

export function DatevConfigForm({ values, onChange }: DatevConfigFormProps) {
    return (
        <View className='gap-5'>
            <FormField
                label='Beraternummer'
                placeholder='e.g. 1234567'
                value={values.beraternummer ?? ''}
                onChangeText={(v) => onChange({ beraternummer: v })}
                keyboardType='number-pad'
                maxLength={7}
                autoComplete='off'
            />

            <FormField
                label='Mandantennummer'
                placeholder='e.g. 12345'
                value={values.mandantennummer ?? ''}
                onChangeText={(v) => onChange({ mandantennummer: v })}
                keyboardType='number-pad'
                maxLength={5}
                autoComplete='off'
            />

            <View className='gap-2'>
                <Text
                    variant='label'
                    color='secondary'
                >
                    Kontenrahmen
                </Text>
                <View className='gap-2'>
                    {SKR_OPTIONS.map((opt) => (
                        <Chip
                            key={opt.value}
                            label={`${opt.label} — ${opt.description}`}
                            selected={values.sachkontenrahmen === opt.value}
                            onPress={() => onChange({ sachkontenrahmen: opt.value })}
                        />
                    ))}
                </View>
            </View>

            <View className='gap-2'>
                <Text
                    variant='label'
                    color='secondary'
                >
                    Sachkontenlänge
                </Text>
                <View className='flex-row flex-wrap gap-2'>
                    {KONTO_LENGTHS.map((len) => (
                        <Chip
                            key={len}
                            label={String(len)}
                            selected={values.sachkontenlaenge === len}
                            onPress={() => onChange({ sachkontenlaenge: len })}
                        />
                    ))}
                </View>
            </View>

            <View className='gap-2'>
                <Text
                    variant='label'
                    color='secondary'
                >
                    Options
                </Text>
                <Chip
                    label='Include document references'
                    selected={values.includeDocumentReferences === true}
                    onPress={() =>
                        onChange({
                            includeDocumentReferences: !values.includeDocumentReferences,
                        })
                    }
                />
            </View>
        </View>
    );
}
