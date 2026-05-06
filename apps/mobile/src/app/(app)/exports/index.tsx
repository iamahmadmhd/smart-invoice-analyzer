import { EmptyState, Icon } from '@/components';
import { Container, ContainerScrollable } from '@/components/atoms/screen-container';
import { InvoiceCardSkeleton } from '@/components/atoms/skeleton';
import { AlertBanner } from '@/components/molecules/alert-banner';
import { ExportCard } from '@/components/molecules/export-card';
import { useExports } from '@/hooks/use-exports';
import { ExportBatch } from '@smart-invoice-analyzer/contracts';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, View } from 'react-native';

export default function ExportsScreen() {
    const router = useRouter();
    const { exports, loading, error, refresh } = useExports();

    const handlePress = useCallback(
        (batch: ExportBatch) => {
            router.push(`/(app)/exports/${batch.exportBatchId}`);
        },
        [router]
    );

    const handleCreate = useCallback(() => {
        router.push('/(app)/exports/create');
    }, [router]);

    if (loading) {
        return (
            <Container className='gap-3 pt-4'>
                {Array.from({ length: 4 }).map((_, i) => (
                    <InvoiceCardSkeleton key={i} />
                ))}
            </Container>
        );
    }

    if (error) {
        return (
            <Container className='pt-4'>
                <AlertBanner
                    variant='error'
                    title='Could not load exports'
                    message={error}
                />
            </Container>
        );
    }

    if (exports.length === 0) {
        return (
            <View className='flex-1'>
                <ContainerScrollable
                    contentContainerClassName='grow'
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={refresh}
                        />
                    }
                >
                    <EmptyState
                        icon='export'
                        title='No exports yet'
                        body='Create a DATEV export to send your invoices to your accountant.'
                        action={{ label: 'Create Export', onPress: handleCreate }}
                    />
                </ContainerScrollable>
            </View>
        );
    }

    return (
        <React.Fragment>
            {Platform.OS === 'web' ? (
                <Container className='flex-none flex-row-reverse items-center justify-between py-4'>
                    <Pressable onPress={refresh}>
                        <Icon name='refresh' />
                    </Pressable>
                </Container>
            ) : null}

            <Container className='px-0 pt-4'>
                <FlatList
                    data={exports}
                    keyExtractor={(item) => item.exportBatchId}
                    renderItem={({ item }) => (
                        <ExportCard
                            batch={item}
                            onPress={() => handlePress(item)}
                        />
                    )}
                    contentContainerClassName='gap-3 grow px-4 pb-8'
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={refresh}
                        />
                    }
                />
            </Container>
        </React.Fragment>
    );
}
