import { Button } from '@/components/atoms/button';
import { RowDivider } from '@/components/atoms/row-divider';
import { Container } from '@/components/atoms/screen-container';
import { InvoiceDetailCardSkeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { AlertBanner } from '@/components/molecules/alert-banner';
import { DetailRow } from '@/components/molecules/detail-row';
import { SectionCard } from '@/components/molecules/section-card';
import { SectionHeader } from '@/components/molecules/section-header';
import { ValidationReportCard } from '@/components/molecules/validation-report-card';
import { useExportDetail } from '@/hooks/use-export-detail';
import { formatDate } from '@/lib/formatters';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Linking, RefreshControl, ScrollView, View } from 'react-native';

export default function ExportDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { batch, loading, error, refresh, download } = useExportDetail(id ?? '');
    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    const handleDownload = useCallback(async () => {
        setDownloading(true);
        setDownloadError(null);
        try {
            const result = await download();
            if (result?.downloadUrl) {
                await Linking.openURL(result.downloadUrl);
            } else {
                setDownloadError('Download link could not be generated.');
            }
        } catch {
            setDownloadError('Download failed. Please try again.');
        } finally {
            setDownloading(false);
        }
    }, [download]);

    if (loading && !batch) {
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
                    title='Could not load export'
                    message={error}
                />
            </Container>
        );
    }

    if (!batch) return null;

    const isGenerating = ['PENDING', 'VALIDATING', 'GENERATING'].includes(batch.status);
    const isCompleted = batch.status === 'COMPLETED';
    const isFailed = batch.status === 'FAILED';

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
                    {/* Hero */}
                    <View className='gap-1.5'>
                        <Text
                            variant='heading3'
                            color='primary'
                        >
                            CSV Export
                        </Text>
                        <Text
                            variant='body-small'
                            color='tertiary'
                        >
                            {batch.periodStart} – {batch.periodEnd}
                        </Text>
                    </View>

                    {/* Status indicators */}
                    {isGenerating && (
                        <AlertBanner
                            variant='info'
                            title='Generating export…'
                            message='This usually takes less than a minute. The page will update automatically.'
                        />
                    )}
                    {isFailed && (
                        <AlertBanner
                            variant='error'
                            title='Export failed'
                            message='Something went wrong while generating the export. Please try again.'
                        />
                    )}
                    {isCompleted && (
                        <AlertBanner
                            variant='success'
                            title='Export ready'
                            message='Your CSV export archive is ready to download.'
                        />
                    )}

                    {downloadError && (
                        <AlertBanner
                            variant='error'
                            message={downloadError}
                            onDismiss={() => setDownloadError(null)}
                        />
                    )}

                    {/* Download CTA */}
                    {isCompleted && (
                        <Button
                            fullWidth
                            loading={downloading}
                            onPress={handleDownload}
                            leftIcon={null}
                        >
                            Download ZIP Archive
                        </Button>
                    )}

                    {isFailed && (
                        <Button
                            fullWidth
                            variant='secondary'
                            onPress={() => router.push('/(app)/exports/create')}
                        >
                            Create New Export
                        </Button>
                    )}

                    {/* Export Configuration */}
                    <View className='gap-1'>
                        <SectionHeader title='Export Configuration' />
                        <SectionCard>
                            <DetailRow
                                label='Format'
                                value='CSV'
                            />
                            <RowDivider />
                            <DetailRow
                                label='Period'
                                value={`${batch.periodStart} – ${batch.periodEnd}`}
                            />
                        </SectionCard>
                    </View>

                    {/* Validation report */}
                    {batch.validationReport && (
                        <View className='gap-1'>
                            <SectionHeader title='Validation Report' />
                            <ValidationReportCard report={batch.validationReport} />
                        </View>
                    )}

                    {/* Metadata */}
                    <View className='gap-1'>
                        <SectionHeader title='Metadata' />
                        <SectionCard>
                            <DetailRow
                                label='Batch ID'
                                value={batch.exportBatchId}
                                valueMono
                            />
                            <RowDivider />
                            <DetailRow
                                label='Created'
                                value={formatDate(batch.createdAt)}
                            />
                            {batch.completedAt && (
                                <>
                                    <RowDivider />
                                    <DetailRow
                                        label='Completed'
                                        value={formatDate(batch.completedAt)}
                                    />
                                </>
                            )}
                        </SectionCard>
                    </View>
                </ScrollView>
            </Container>
        </View>
    );
}
