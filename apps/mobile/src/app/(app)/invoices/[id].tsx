import {
    AlertBanner,
    ConfidenceBar,
    Container,
    EmptyState,
    InvoiceBadges,
    InvoiceDetailCardSkeleton,
    InvoiceHero,
    RowDivider,
    SectionCard,
} from '@/components';
import { DetailRow } from '@/components/molecules/detail-row';
import { InsightCard } from '@/components/molecules/insight-card';
import { SectionHeader } from '@/components/molecules/section-header';
import { useInvoiceDetail } from '@/hooks/use-invoice-detail';
import { formatAmount, formatDate, formatTaxRate } from '@/lib/formatters';
import { getStatusLabel } from '@/lib/invoice-utils';
import { capitalize } from '@/lib/string-utils';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

export default function InvoiceDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { invoice, insights, loading, error, refresh } = useInvoiceDetail(id ?? '');

    const summaryInsight = insights.find((i) => i.type === 'SUMMARY');
    const flagInsights = insights.filter((i) => i.type !== 'SUMMARY');

    if (loading) {
        return (
            <View className='flex-1'>
                <Container>
                    <InvoiceDetailCardSkeleton />
                </Container>
            </View>
        );
    }

    if (error) {
        return (
            <View className='flex-1'>
                <Container>
                    <AlertBanner
                        variant='error'
                        title='Could not load invoice'
                        message={error}
                    />
                </Container>
            </View>
        );
    }

    if (!invoice) {
        return (
            <View className='flex-1'>
                <Container>
                    <EmptyState
                        icon='invoice'
                        title='Invoice not found'
                        body='The requested invoice could not be found.'
                    />
                </Container>
            </View>
        );
    }

    return (
        <View className='flex-1'>
            <Container>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerClassName='gap-4 pt-2 pb-10'
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={refresh}
                        />
                    }
                >
                    <InvoiceHero
                        vendorName={invoice.vendorName}
                        invoiceNumber={invoice.invoiceNumber}
                    />

                    <InvoiceBadges
                        status={invoice.status}
                        duplicateFlag={invoice.duplicateFlag}
                        anomalyFlag={invoice.anomalyFlag}
                        exportStatus={invoice.exportStatus}
                    />

                    {invoice.confidenceScore !== undefined && (
                        <ConfidenceBar score={invoice.confidenceScore} />
                    )}

                    <View className='gap-2'>
                        {summaryInsight && <InsightCard insight={summaryInsight} />}
                        {flagInsights.map((insight) => (
                            <InsightCard
                                key={insight.insightId}
                                insight={insight}
                            />
                        ))}
                    </View>

                    <View className='gap-1'>
                        <SectionHeader title='Financial' />
                        <SectionCard>
                            <DetailRow
                                label='Total'
                                value={formatAmount(invoice.totalAmount, invoice.currency)}
                            />
                            {invoice.netAmount !== undefined && (
                                <>
                                    <RowDivider />
                                    <DetailRow
                                        label='Net amount'
                                        value={formatAmount(invoice.netAmount, invoice.currency)}
                                    />
                                </>
                            )}
                            {invoice.taxAmount !== undefined && (
                                <>
                                    <RowDivider />
                                    <DetailRow
                                        label='Tax amount'
                                        value={formatAmount(invoice.taxAmount, invoice.currency)}
                                    />
                                </>
                            )}
                            <RowDivider />
                            <DetailRow
                                label='VAT rate'
                                value={formatTaxRate(invoice.taxRate)}
                            />
                            <RowDivider />
                            <DetailRow
                                label='Currency'
                                value={invoice.currency}
                            />
                        </SectionCard>
                    </View>

                    <View className='gap-1'>
                        <SectionHeader title='Details' />
                        <SectionCard>
                            <DetailRow
                                label='Invoice date'
                                value={formatDate(invoice.invoiceDate)}
                            />
                            {invoice.dueDate && (
                                <>
                                    <RowDivider />
                                    <DetailRow
                                        label='Due date'
                                        value={formatDate(invoice.dueDate)}
                                    />
                                </>
                            )}
                            <RowDivider />
                            <DetailRow
                                label='Category'
                                value={capitalize(invoice.category)}
                            />
                            {invoice.vatIdOrTaxNumber && (
                                <>
                                    <RowDivider />
                                    <DetailRow
                                        label='VAT / Tax ID'
                                        value={invoice.vatIdOrTaxNumber}
                                        valueMono
                                    />
                                </>
                            )}
                            <RowDivider />
                            <DetailRow
                                label='Status'
                                value={getStatusLabel(invoice.status)}
                            />
                        </SectionCard>
                    </View>

                    <View className='gap-1'>
                        <SectionHeader title='Export' />
                        <SectionCard>
                            <DetailRow
                                label='Export status'
                                value={
                                    invoice.exportStatus === 'EXPORTED'
                                        ? 'Exported'
                                        : 'Not exported'
                                }
                            />
                            {invoice.exportedAt && (
                                <>
                                    <RowDivider />
                                    <DetailRow
                                        label='Exported at'
                                        value={formatDate(invoice.exportedAt)}
                                    />
                                </>
                            )}
                            {invoice.exportBatchId && (
                                <>
                                    <RowDivider />
                                    <DetailRow
                                        label='Batch ID'
                                        value={invoice.exportBatchId}
                                        valueMono
                                    />
                                </>
                            )}
                        </SectionCard>
                    </View>

                    <View className='gap-1'>
                        <SectionHeader title='Metadata' />
                        <SectionCard>
                            <DetailRow
                                label='Invoice ID'
                                value={invoice.invoiceId}
                                valueMono
                            />
                            <RowDivider />
                            <DetailRow
                                label='Created'
                                value={formatDate(invoice.createdAt)}
                            />
                            <RowDivider />
                            <DetailRow
                                label='Updated'
                                value={formatDate(invoice.updatedAt)}
                            />
                        </SectionCard>
                    </View>
                </ScrollView>
            </Container>
        </View>
    );
}
