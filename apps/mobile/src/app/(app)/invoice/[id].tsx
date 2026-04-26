import { AlertBanner, Badge, Icon, Spinner, Text } from '@/components';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearSelected, fetchInvoice, fetchInsights } from '@/store/slices/invoice-slice';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { Insight } from '@/lib/api-client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAmount(amount: number | undefined, currency = 'EUR'): string {
    if (amount === undefined) return '—';
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

function formatDate(iso: string | undefined): string {
    if (!iso) return '—';
    const [year, month, day] = iso.split('-');
    return `${day}.${month}.${year}`;
}

function isProcessing(status: string): boolean {
    return ['UPLOADED', 'PROCESSING', 'EXTRACTED', 'ENRICHED', 'REVIEW_READY'].includes(status);
}

function isFailed(status: string): boolean {
    return status.startsWith('FAILED_');
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
    return (
        <Text
            variant='label-small'
            color='tertiary'
            className='mt-1 mb-3'
        >
            {title}
        </Text>
    );
}

function FieldRow({
    label,
    value,
    monospace,
}: {
    label: string;
    value?: string | number | null;
    monospace?: boolean;
}) {
    if (value === undefined || value === null || value === '') return null;
    return (
        <View className='flex-row items-start justify-between border-b border-wire py-2.5 dark:border-wire-night'>
            <Text
                variant='body-small'
                color='secondary'
                className='flex-1'
            >
                {label}
            </Text>
            <Text
                variant={monospace ? 'mono' : 'body-small'}
                color='primary'
                className='flex-1 text-right'
                numberOfLines={2}
            >
                {String(value)}
            </Text>
        </View>
    );
}

function StatusBanner({ status }: { status: string }) {
    if (isProcessing(status)) {
        return (
            <View className='mx-4 mb-4 flex-row items-center gap-3 rounded-xl border border-azure-border bg-azure-subtle p-3 dark:border-azure-border/30 dark:bg-azure-night-subtle'>
                <Spinner
                    size='sm'
                    color='brand'
                />
                <View>
                    <Text
                        variant='label'
                        color='brand'
                    >
                        Processing your invoice
                    </Text>
                    <Text
                        variant='caption'
                        color='secondary'
                    >
                        OCR, AI extraction and analysis are running
                    </Text>
                </View>
            </View>
        );
    }
    if (isFailed(status)) {
        return (
            <AlertBanner
                variant='error'
                title='Processing failed'
                message="We couldn't fully process this invoice. Some fields may be missing."
                className='mx-4 mb-4'
            />
        );
    }
    return null;
}

function InsightCard({ insight }: { insight: Insight }) {
    const isAnomaly = insight.type === 'ANOMALY';
    const isDuplicate = insight.type === 'DUPLICATE';
    const isSummary = insight.type === 'SUMMARY';

    const variant = isAnomaly ? 'error' : isDuplicate ? 'warning' : 'info';
    const iconName = isAnomaly ? 'warning' : isDuplicate ? 'duplicate' : 'info';
    const title = isAnomaly
        ? 'Anomaly detected'
        : isDuplicate
          ? 'Possible duplicate'
          : isSummary
            ? 'AI Summary'
            : 'Insight';

    const body = isSummary
        ? (insight.payload.summary as string)
        : isDuplicate
          ? (insight.payload.reason as string)
          : Array.isArray(insight.payload.reasons)
            ? (insight.payload.reasons as string[]).join('\n')
            : '';

    return (
        <AlertBanner
            variant={variant as any}
            title={title}
            message={body}
            className='mb-3'
        />
    );
}

function ConfidenceBar({ score }: { score: number }) {
    const pct = Math.round(score * 100);
    const color = pct >= 80 ? colors.jade : pct >= 50 ? colors.amber : colors.crimson;

    return (
        <View className='mb-6'>
            <View className='mb-1.5 flex-row items-center justify-between'>
                <Text
                    variant='label'
                    color='secondary'
                >
                    Extraction confidence
                </Text>
                <Text
                    variant='label'
                    color='primary'
                >
                    {pct}%
                </Text>
            </View>
            <View className='h-2 w-full overflow-hidden rounded-full bg-canvas-inset dark:bg-night-raised'>
                <View
                    className='h-full rounded-full'
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </View>
            {pct < 70 && (
                <Text
                    variant='caption'
                    color='tertiary'
                    className='mt-1'
                >
                    Low confidence — please verify the extracted fields
                </Text>
            )}
        </View>
    );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function InvoiceDetail() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { selectedInvoice, detailStatus, insights, insightStatus, error } = useAppSelector(
        (s) => s.invoices
    );
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(() => {
        if (id) {
            dispatch(fetchInvoice(id));
            dispatch(fetchInsights(id));
        }
    }, [id, dispatch]);

    useEffect(() => {
        load();
        return () => {
            dispatch(clearSelected());
        };
    }, [load]);

    // Poll while processing
    useEffect(() => {
        if (!selectedInvoice || !isProcessing(selectedInvoice.status)) return;
        const timer = setInterval(() => {
            dispatch(fetchInvoice(selectedInvoice.invoiceId));
        }, 5000);
        return () => clearInterval(timer);
    }, [selectedInvoice?.status]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    // ── Loading state ─────────────────────────────────────────────────────────

    if (detailStatus === 'loading' && !selectedInvoice) {
        return (
            <SafeAreaView className='flex-1 items-center justify-center bg-canvas-subtle dark:bg-night'>
                <Spinner size='lg' />
            </SafeAreaView>
        );
    }

    if (error && !selectedInvoice) {
        return (
            <SafeAreaView className='flex-1 bg-canvas-subtle p-6 dark:bg-night'>
                <AlertBanner
                    variant='error'
                    message={error}
                />
            </SafeAreaView>
        );
    }

    const invoice = selectedInvoice;

    return (
        <SafeAreaView className='flex-1 bg-canvas-subtle dark:bg-night'>
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <View className='flex-row items-center px-4 py-3'>
                <Pressable
                    onPress={() => router.back()}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    className='mr-3'
                >
                    <Icon
                        name='back'
                        size={20}
                        color='primary'
                    />
                </Pressable>
                <View className='flex-1'>
                    <Text
                        variant='heading3'
                        color='primary'
                        numberOfLines={1}
                    >
                        {invoice?.vendorName ?? 'Invoice'}
                    </Text>
                    {invoice?.invoiceNumber && (
                        <Text
                            variant='caption'
                            color='tertiary'
                        >
                            #{invoice.invoiceNumber}
                        </Text>
                    )}
                </View>
                {invoice && (
                    <View className='flex-row gap-2'>
                        {invoice.duplicateFlag && (
                            <Badge
                                label='Dup'
                                variant='warning'
                                size='sm'
                            />
                        )}
                        {invoice.anomalyFlag && (
                            <Badge
                                label='Anomaly'
                                variant='error'
                                size='sm'
                            />
                        )}
                        {invoice.exportStatus === 'EXPORTED' && (
                            <Badge
                                label='Exported'
                                variant='success'
                                size='sm'
                            />
                        )}
                    </View>
                )}
            </View>

            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.brand}
                    />
                }
                contentContainerClassName='pb-10'
            >
                {/* ── Processing / failed banner ──────────────────────────────── */}
                {invoice && <StatusBanner status={invoice.status} />}

                {/* ── Amount hero ─────────────────────────────────────────────── */}
                {invoice?.totalAmount !== undefined && (
                    <View className='mx-4 mb-5 items-center rounded-2xl border border-wire bg-canvas p-5 dark:border-wire-night dark:bg-night-inset'>
                        <Text
                            variant='caption'
                            color='tertiary'
                        >
                            Total amount
                        </Text>
                        <Text
                            variant='display'
                            color='primary'
                            className='mt-1'
                        >
                            {formatAmount(invoice.totalAmount, invoice.currency)}
                        </Text>
                        <View className='mt-3 flex-row gap-3'>
                            {invoice.netAmount !== undefined && (
                                <View className='items-center'>
                                    <Text
                                        variant='caption'
                                        color='tertiary'
                                    >
                                        Net
                                    </Text>
                                    <Text
                                        variant='body-medium'
                                        color='secondary'
                                    >
                                        {formatAmount(invoice.netAmount, invoice.currency)}
                                    </Text>
                                </View>
                            )}
                            {invoice.taxAmount !== undefined && (
                                <View className='items-center'>
                                    <Text
                                        variant='caption'
                                        color='tertiary'
                                    >
                                        VAT ({invoice.taxRate ?? '?'}%)
                                    </Text>
                                    <Text
                                        variant='body-medium'
                                        color='secondary'
                                    >
                                        {formatAmount(invoice.taxAmount, invoice.currency)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                <View className='px-4'>
                    {/* ── Confidence ───────────────────────────────────────────── */}
                    {invoice?.confidenceScore !== undefined && (
                        <ConfidenceBar score={invoice.confidenceScore} />
                    )}

                    {/* ── Insights (summary, duplicate, anomaly) ────────────────── */}
                    {insights.length > 0 && (
                        <View className='mb-6'>
                            <SectionHeader title='AI ANALYSIS' />
                            {insights.map((ins) => (
                                <InsightCard
                                    key={ins.insightId}
                                    insight={ins}
                                />
                            ))}
                        </View>
                    )}
                    {insightStatus === 'loading' && insights.length === 0 && (
                        <View className='mb-6 items-center py-4'>
                            <Spinner size='sm' />
                        </View>
                    )}

                    {/* ── Invoice details ────────────────────────────────────────── */}
                    {invoice && (
                        <>
                            <SectionHeader title='INVOICE DETAILS' />
                            <View className='mb-6 overflow-hidden rounded-xl border border-wire bg-canvas px-4 dark:border-wire-night dark:bg-night-inset'>
                                <FieldRow
                                    label='Vendor'
                                    value={invoice.vendorName}
                                />
                                <FieldRow
                                    label='Invoice number'
                                    value={invoice.invoiceNumber}
                                    monospace
                                />
                                <FieldRow
                                    label='Invoice date'
                                    value={formatDate(invoice.invoiceDate)}
                                />
                                <FieldRow
                                    label='Due date'
                                    value={formatDate(invoice.dueDate)}
                                />
                                <FieldRow
                                    label='Category'
                                    value={invoice.category}
                                />
                                <FieldRow
                                    label='Currency'
                                    value={invoice.currency}
                                />
                                <FieldRow
                                    label='VAT ID / Tax number'
                                    value={invoice.vatIdOrTaxNumber}
                                    monospace
                                />
                            </View>

                            {/* ── Processing metadata ───────────────────────────── */}
                            <SectionHeader title='PROCESSING' />
                            <View className='mb-6 overflow-hidden rounded-xl border border-wire bg-canvas px-4 dark:border-wire-night dark:bg-night-inset'>
                                <FieldRow
                                    label='Status'
                                    value={invoice.status}
                                />
                                <FieldRow
                                    label='Export status'
                                    value={invoice.exportStatus}
                                />
                                {invoice.exportedAt && (
                                    <FieldRow
                                        label='Exported at'
                                        value={formatDate(invoice.exportedAt.slice(0, 10))}
                                    />
                                )}
                                <FieldRow
                                    label='Created'
                                    value={formatDate(invoice.createdAt.slice(0, 10))}
                                />
                                <FieldRow
                                    label='Invoice ID'
                                    value={invoice.invoiceId}
                                    monospace
                                />
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
