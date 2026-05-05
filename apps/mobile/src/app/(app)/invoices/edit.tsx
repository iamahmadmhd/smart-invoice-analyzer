import { Button } from '@/components/atoms/button';
import { Chip } from '@/components/atoms/chip';
import { Container, ContainerScrollable } from '@/components/atoms/screen-container';
import { InvoiceDetailCardSkeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { AlertBanner } from '@/components/molecules/alert-banner';
import { FormField } from '@/components/molecules/form-field';
import { SectionHeader } from '@/components/molecules/section-header';
import { useInvoiceDetail } from '@/hooks/use-invoice-detail';
import { useAppDispatch } from '@/store';
import { updateInvoiceThunk } from '@/store/slices/invoices-slice';
import { UpdateInvoiceRequest } from '@smart-invoice-analyzer/contracts';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

const TAX_RATE_OPTIONS = [
    { label: '0 %', value: 0 },
    { label: '7 %', value: 7 },
    { label: '19 %', value: 19 },
];

const CATEGORY_OPTIONS = [
    'software',
    'hardware',
    'office',
    'travel',
    'marketing',
    'utilities',
    'consulting',
    'other',
] as const;

type DraftFields = {
    vendorName: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    currency: string;
    netAmount: string;
    taxAmount: string;
    taxRate: number | undefined;
    totalAmount: string;
    vatIdOrTaxNumber: string;
    category: string;
};

function invoiceToDraft(invoice: any): DraftFields {
    return {
        vendorName: invoice.vendorName ?? '',
        invoiceNumber: invoice.invoiceNumber ?? '',
        invoiceDate: invoice.invoiceDate ?? '',
        dueDate: invoice.dueDate ?? '',
        currency: invoice.currency ?? 'EUR',
        netAmount: invoice.netAmount !== undefined ? String(invoice.netAmount) : '',
        taxAmount: invoice.taxAmount !== undefined ? String(invoice.taxAmount) : '',
        taxRate: invoice.taxRate,
        totalAmount: invoice.totalAmount !== undefined ? String(invoice.totalAmount) : '',
        vatIdOrTaxNumber: invoice.vatIdOrTaxNumber ?? '',
        category: invoice.category ?? '',
    };
}

function draftToRequest(draft: DraftFields): UpdateInvoiceRequest {
    const patch: UpdateInvoiceRequest = {};
    if (draft.vendorName.trim()) patch.vendorName = draft.vendorName.trim();
    if (draft.invoiceNumber.trim()) patch.invoiceNumber = draft.invoiceNumber.trim();
    if (draft.invoiceDate.trim()) patch.invoiceDate = draft.invoiceDate.trim();
    if (draft.dueDate.trim()) patch.dueDate = draft.dueDate.trim();
    else patch.dueDate = undefined;
    if (draft.currency.trim()) patch.currency = draft.currency.trim().toUpperCase();
    const net = parseFloat(draft.netAmount);
    if (!isNaN(net)) patch.netAmount = net;
    const tax = parseFloat(draft.taxAmount);
    if (!isNaN(tax)) patch.taxAmount = tax;
    if (draft.taxRate !== undefined) patch.taxRate = draft.taxRate;
    const total = parseFloat(draft.totalAmount);
    if (!isNaN(total)) patch.totalAmount = total;
    if (draft.vatIdOrTaxNumber.trim()) patch.vatIdOrTaxNumber = draft.vatIdOrTaxNumber.trim();
    if (draft.category) patch.category = draft.category as UpdateInvoiceRequest['category'];
    return patch;
}

function validate(draft: DraftFields): string | null {
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (draft.invoiceDate && !dateRe.test(draft.invoiceDate)) {
        return 'Invoice date must be in YYYY-MM-DD format.';
    }
    if (draft.dueDate && !dateRe.test(draft.dueDate)) {
        return 'Due date must be in YYYY-MM-DD format.';
    }
    const total = parseFloat(draft.totalAmount);
    if (draft.totalAmount && isNaN(total)) {
        return 'Total amount must be a valid number.';
    }
    const net = parseFloat(draft.netAmount);
    if (draft.netAmount && isNaN(net)) {
        return 'Net amount must be a valid number.';
    }
    const taxAmt = parseFloat(draft.taxAmount);
    if (draft.taxAmount && isNaN(taxAmt)) {
        return 'Tax amount must be a valid number.';
    }
    return null;
}

export default function InvoiceEditScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { invoice, loading, error } = useInvoiceDetail(id ?? '');

    const [draft, setDraft] = useState<DraftFields | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        if (invoice && !draft) {
            setDraft(invoiceToDraft(invoice));
        }
    }, [invoice]);

    const update = (key: keyof DraftFields, value: any) => {
        setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    };

    const handleSave = async () => {
        if (!draft || !id) return;
        const validationError = validate(draft);
        if (validationError) {
            setSaveError(validationError);
            return;
        }
        setSaveError(null);
        setSaving(true);
        const result = await dispatch(
            updateInvoiceThunk({ invoiceId: id, patch: draftToRequest(draft) })
        );
        setSaving(false);
        if (updateInvoiceThunk.fulfilled.match(result)) {
            router.back();
        } else {
            setSaveError((result.payload as string) ?? 'Failed to save changes.');
        }
    };

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
                {saveError && (
                    <AlertBanner
                        variant='error'
                        message={saveError}
                        onDismiss={() => setSaveError(null)}
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

                    {/* VAT rate chip selector */}
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
