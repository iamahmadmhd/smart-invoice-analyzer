import { Button } from '@/components/atoms/button';
import { Chip } from '@/components/atoms/chip';
import { Container, ContainerScrollable } from '@/components/atoms/screen-container';
import { InvoiceDetailCardSkeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { AlertBanner } from '@/components/molecules/alert-banner';
import { FormField } from '@/components/molecules/form-field';
import { SectionHeader } from '@/components/molecules/section-header';
import { CATEGORY_OPTIONS, TAX_RATE_OPTIONS } from '@/constants/invoice';
import { useInvoiceDetail } from '@/hooks/use-invoice-detail';
import { useInvoiceEdit } from '@/hooks/use-invoice-edit';
import {
    draftToRequest,
    InvoiceDraftFields,
    invoiceToDraft,
    validateInvoiceDraft,
} from '@/lib/invoice-draft';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

export default function InvoiceEditScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const { invoice, loading, error } = useInvoiceDetail(id ?? '');
    const { save, saving, saveError, clearError } = useInvoiceEdit(id ?? '');

    const [draft, setDraft] = useState<InvoiceDraftFields | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        if (invoice && !draft) {
            setDraft(invoiceToDraft(invoice));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoice]);

    const update = (key: keyof InvoiceDraftFields, value: InvoiceDraftFields[typeof key]) => {
        setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    };

    const handleSave = async () => {
        if (!draft || !id) return;
        const fieldError = validateInvoiceDraft(draft);
        if (fieldError) {
            setValidationError(fieldError);
            return;
        }
        setValidationError(null);
        const succeeded = await save(draftToRequest(draft));
        if (succeeded) router.back();
    };

    const displayError = validationError ?? saveError;

    if (loading && !draft) {
        return (
            <Container>
                <InvoiceDetailCardSkeleton />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className='pt-4'>
                <AlertBanner
                    variant='error'
                    title='Could not load invoice'
                    message={error}
                />
            </Container>
        );
    }

    if (!draft) return null;

    return (
        <ContainerScrollable
            contentContainerClassName='pb-10 pt-4'
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
        >
            <View className='gap-6'>
                {displayError && (
                    <AlertBanner
                        variant='error'
                        message={displayError}
                        onDismiss={() => {
                            setValidationError(null);
                            clearError();
                        }}
                    />
                )}

                {/* Vendor */}
                <View className='gap-4'>
                    <SectionHeader title='Vendor' />
                    <FormField
                        label='Vendor name'
                        placeholder='e.g. ACME GmbH'
                        value={draft.vendorName}
                        onChangeText={(v) => update('vendorName', v)}
                        autoCapitalize='words'
                        autoCorrect={false}
                        returnKeyType='next'
                    />
                    <FormField
                        label='Invoice number'
                        placeholder='e.g. RE-2024-0042'
                        value={draft.invoiceNumber}
                        onChangeText={(v) => update('invoiceNumber', v)}
                        autoCapitalize='characters'
                        autoCorrect={false}
                        returnKeyType='next'
                    />
                    <FormField
                        label='VAT / Tax ID'
                        placeholder='e.g. DE123456789'
                        value={draft.vatIdOrTaxNumber}
                        onChangeText={(v) => update('vatIdOrTaxNumber', v)}
                        autoCapitalize='characters'
                        autoCorrect={false}
                        returnKeyType='next'
                    />
                </View>

                {/* Dates */}
                <View className='gap-4'>
                    <SectionHeader title='Dates' />
                    <FormField
                        label='Invoice date'
                        placeholder='YYYY-MM-DD'
                        value={draft.invoiceDate}
                        onChangeText={(v) => update('invoiceDate', v)}
                        keyboardType='numbers-and-punctuation'
                        autoCorrect={false}
                        returnKeyType='next'
                    />
                    <FormField
                        label='Due date (optional)'
                        placeholder='YYYY-MM-DD'
                        value={draft.dueDate}
                        onChangeText={(v) => update('dueDate', v)}
                        keyboardType='numbers-and-punctuation'
                        autoCorrect={false}
                        returnKeyType='next'
                    />
                </View>

                {/* Amounts */}
                <View className='gap-4'>
                    <SectionHeader title='Amounts' />
                    <View className='flex-row gap-3'>
                        <View className='flex-1'>
                            <FormField
                                label='Total amount'
                                placeholder='0.00'
                                value={draft.totalAmount}
                                onChangeText={(v) => update('totalAmount', v)}
                                keyboardType='decimal-pad'
                                returnKeyType='next'
                            />
                        </View>
                        <View className='w-20'>
                            <FormField
                                label='Currency'
                                placeholder='EUR'
                                value={draft.currency}
                                onChangeText={(v) => update('currency', v)}
                                autoCapitalize='characters'
                                autoCorrect={false}
                                maxLength={3}
                                returnKeyType='next'
                            />
                        </View>
                    </View>
                    <View className='flex-row gap-3'>
                        <View className='flex-1'>
                            <FormField
                                label='Net amount'
                                placeholder='0.00'
                                value={draft.netAmount}
                                onChangeText={(v) => update('netAmount', v)}
                                keyboardType='decimal-pad'
                                returnKeyType='next'
                            />
                        </View>
                        <View className='flex-1'>
                            <FormField
                                label='Tax amount'
                                placeholder='0.00'
                                value={draft.taxAmount}
                                onChangeText={(v) => update('taxAmount', v)}
                                keyboardType='decimal-pad'
                                returnKeyType='next'
                            />
                        </View>
                    </View>

                    {/* VAT rate */}
                    <View className='gap-2'>
                        <Text
                            variant='label'
                            color='secondary'
                        >
                            VAT rate
                        </Text>
                        <View className='flex-row gap-2'>
                            {TAX_RATE_OPTIONS.map((opt) => (
                                <Chip
                                    key={opt.value}
                                    label={opt.label}
                                    selected={draft.taxRate === opt.value}
                                    onPress={() =>
                                        update(
                                            'taxRate',
                                            draft.taxRate === opt.value ? undefined : opt.value
                                        )
                                    }
                                />
                            ))}
                        </View>
                    </View>
                </View>

                {/* Category */}
                <View className='gap-2'>
                    <SectionHeader title='Category' />
                    <View className='flex-row flex-wrap gap-2'>
                        {CATEGORY_OPTIONS.map((cat) => (
                            <Chip
                                key={cat}
                                label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                                selected={draft.category === cat}
                                onPress={() =>
                                    update('category', draft.category === cat ? '' : cat)
                                }
                            />
                        ))}
                    </View>
                </View>

                {/* Actions */}
                <View className='gap-3 pt-2'>
                    <Button
                        fullWidth
                        loading={saving}
                        onPress={handleSave}
                    >
                        Save changes
                    </Button>
                    <Button
                        fullWidth
                        variant='secondary'
                        disabled={saving}
                        onPress={() => router.back()}
                    >
                        Cancel
                    </Button>
                </View>
            </View>
        </ContainerScrollable>
    );
}
