import { AlertBanner, Icon, Spinner, Text } from '@/components';
import { InvoiceCard } from '@/components/atoms/invoice-card';
import { useAppDispatch, useAppSelector } from '@/store';
import {
    clearError,
    fetchInvoices,
    fetchMoreInvoices,
    setFilters,
} from '@/store/slices/invoice-slice';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    TextInput,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { cn } from '@/lib/utils';

// ── Filter chip ───────────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
    { label: 'All', value: undefined },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Done', value: 'COMPLETED' },
    { label: 'Failed', value: 'FAILED_OCR' },
    { label: 'Duplicates', value: undefined, flag: 'duplicate' },
    { label: 'Anomalies', value: undefined, flag: 'anomaly' },
] as const;

function FilterChip({
    label,
    active,
    onPress,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            className={cn(
                'mr-2 rounded-full border px-3 py-1.5',
                active
                    ? 'border-brand bg-brand'
                    : 'border-wire bg-canvas dark:border-wire-night dark:bg-night-inset'
            )}
        >
            <Text
                variant='caption'
                className={active ? 'text-white' : undefined}
                color={active ? undefined : 'secondary'}
            >
                {label}
            </Text>
        </Pressable>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
    return (
        <View className='flex-1 items-center justify-center gap-3 py-20'>
            <View className='h-16 w-16 items-center justify-center rounded-2xl bg-canvas-inset dark:bg-night-raised'>
                <Icon
                    name='invoice'
                    size={28}
                    color='tertiary'
                />
            </View>
            <View className='items-center gap-1'>
                <Text
                    variant='body-semibold'
                    color='primary'
                >
                    {filtered ? 'No results' : 'No invoices yet'}
                </Text>
                <Text
                    variant='body-small'
                    color='tertiary'
                    className='max-w-xs text-center'
                >
                    {filtered
                        ? 'Try adjusting your filters'
                        : 'Tap the upload button to add your first invoice'}
                </Text>
            </View>
        </View>
    );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { items, status, error, nextToken, filters } = useAppSelector((state) => state.invoices);
    const theme = useColorScheme();

    const [searchText, setSearchText] = useState('');
    const [activeFilter, setActiveFilter] = useState<(typeof FILTER_OPTIONS)[number]>(
        FILTER_OPTIONS[0]
    );
    const [refreshing, setRefreshing] = useState(false);
    const searchRef = useRef<TextInput>(null);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initial load
    useEffect(() => {
        dispatch(fetchInvoices(filters));
    }, []);

    useEffect(() => {
        console.log({ theme });
    }, [theme]);

    // Debounced vendor search
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            const newFilters = {
                ...filters,
                vendorName: searchText || undefined,
            };
            dispatch(setFilters(newFilters));
            dispatch(fetchInvoices(newFilters));
        }, 400);
        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [searchText]);

    const handleFilterPress = useCallback(
        (opt: (typeof FILTER_OPTIONS)[number]) => {
            setActiveFilter(opt);
            const newFilters = {
                limit: '20',
                vendorName: searchText || undefined,
                status: 'value' in opt && opt.value ? opt.value : undefined,
                duplicateFlag: 'flag' in opt && opt.flag === 'duplicate' ? 'true' : undefined,
                anomalyFlag: 'flag' in opt && opt.flag === 'anomaly' ? 'true' : undefined,
            };
            dispatch(setFilters(newFilters));
            dispatch(fetchInvoices(newFilters));
        },
        [searchText, dispatch]
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await dispatch(fetchInvoices(filters));
        setRefreshing(false);
    }, [dispatch, filters]);

    const handleLoadMore = useCallback(() => {
        if (nextToken && status !== 'loading') {
            dispatch(fetchMoreInvoices({ ...filters, nextToken }));
        }
    }, [nextToken, status, filters, dispatch]);

    const isFiltered = !!searchText || activeFilter !== FILTER_OPTIONS[0];

    return (
        <SafeAreaView className='flex-1 bg-canvas-subtle dark:bg-night'>
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <View className='px-4 pt-2 pb-3'>
                <View className='mb-4 flex-row items-center justify-between'>
                    <View>
                        <Text
                            variant='heading2'
                            color='primary'
                        >
                            Invoices
                        </Text>
                        <Text
                            variant='caption'
                            color='tertiary'
                        >
                            {items.length} document{items.length !== 1 ? 's' : ''}
                        </Text>
                    </View>

                    <Pressable
                        onPress={() => router.push('/(app)/upload')}
                        className='h-11 w-11 items-center justify-center rounded-xl bg-brand active:opacity-70'
                        accessibilityLabel='Upload invoice'
                        accessibilityRole='button'
                    >
                        <Icon
                            name='plus'
                            size={22}
                            color='inverse'
                        />
                    </Pressable>
                </View>

                {/* Search bar */}
                <View className='mb-3 h-11 flex-row items-center gap-2 rounded-xl border border-wire bg-canvas px-3 dark:border-wire-night dark:bg-night-inset'>
                    <Icon
                        name='search'
                        size={16}
                        color='tertiary'
                    />
                    <TextInput
                        ref={searchRef}
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholder='Search vendors...'
                        placeholderTextColor={colors.inkFaint}
                        className='flex-1 text-base text-ink dark:text-cloud'
                        style={{ fontFamily: 'PlusJakartaSans_400Regular' }}
                        returnKeyType='search'
                        autoCorrect={false}
                        autoCapitalize='none'
                    />
                    {searchText.length > 0 && (
                        <Pressable onPress={() => setSearchText('')}>
                            <Icon
                                name='close'
                                size={14}
                                color='tertiary'
                            />
                        </Pressable>
                    )}
                </View>

                {/* Filter chips */}
                <FlatList
                    data={FILTER_OPTIONS}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.label}
                    renderItem={({ item }) => (
                        <FilterChip
                            label={item.label}
                            active={activeFilter.label === item.label}
                            onPress={() => handleFilterPress(item)}
                        />
                    )}
                />
            </View>

            {/* ── Error ──────────────────────────────────────────────────────── */}
            {error && (
                <AlertBanner
                    variant='error'
                    message={error}
                    onDismiss={() => dispatch(clearError())}
                    className='mx-4 mb-3'
                />
            )}

            {/* ── List ───────────────────────────────────────────────────────── */}
            {status === 'loading' && items.length === 0 ? (
                <View className='flex-1 items-center justify-center'>
                    <Spinner size='lg' />
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.invoiceId}
                    contentContainerClassName='px-4 pb-8'
                    ItemSeparatorComponent={() => <View className='h-3' />}
                    ListEmptyComponent={<EmptyState filtered={isFiltered} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.brand}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                        nextToken && status === 'loading' ? (
                            <View className='items-center py-4'>
                                <ActivityIndicator
                                    size='small'
                                    color={colors.brand}
                                />
                            </View>
                        ) : null
                    }
                    renderItem={({ item }) => (
                        <InvoiceCard
                            invoice={item}
                            onPress={() =>
                                router.push({
                                    pathname: '/(app)/invoice/[id]',
                                    params: { id: item.invoiceId },
                                })
                            }
                        />
                    )}
                />
            )}
        </SafeAreaView>
    );
}
