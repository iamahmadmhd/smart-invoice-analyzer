import { Icon } from '@/components/atoms/icon';
import { StackHeader } from '@/components/molecules/stack-header';
import { useAppDispatch } from '@/store';
import { deleteInvoiceThunk } from '@/store/slices/invoices-slice';
import { Stack, useRouter } from 'expo-router';
import { Alert, Pressable, useColorScheme } from 'react-native';
import { useResolveClassNames } from 'uniwind';

// ── Delete button used in the [id] screen header ──────────────────────────────
// Defined here so it can close over the router and dispatch without prop-drilling.

function useDeleteInvoice(invoiceId: string | undefined) {
    const dispatch = useAppDispatch();
    const router = useRouter();

    return () => {
        if (!invoiceId) return;
        Alert.alert(
            'Delete invoice',
            'This will permanently delete the invoice and all related data. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await dispatch(deleteInvoiceThunk(invoiceId));
                        if (deleteInvoiceThunk.fulfilled.match(result)) {
                            // Go back to the invoices list
                            router.dismissTo('/(app)/invoices');
                        } else {
                            Alert.alert(
                                'Delete failed',
                                (result.payload as string) ?? 'Something went wrong.'
                            );
                        }
                    },
                },
            ]
        );
    };
}

// ── Detail header right slot ──────────────────────────────────────────────────

function DetailHeaderRight({ invoiceId }: { invoiceId?: string }) {
    const router = useRouter();
    const handleDelete = useDeleteInvoice(invoiceId);

    return (
        <>
            <Pressable
                onPress={() => router.push(`/(app)/invoices/edit?id=${invoiceId}`)}
                hitSlop={{ top: 8, right: 4, bottom: 8, left: 8 }}
                accessibilityLabel='Edit invoice'
                className='mr-1'
            >
                <Icon
                    name='edit'
                    size={20}
                    color='secondary'
                />
            </Pressable>
            <Pressable
                onPress={handleDelete}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 4 }}
                accessibilityLabel='Delete invoice'
            >
                <Icon
                    name='trash'
                    size={20}
                    color='error'
                />
            </Pressable>
        </>
    );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function InvoicesLayout() {
    const scheme = useColorScheme();
    const router = useRouter();
    const dark = scheme === 'dark';
    const classNames = useResolveClassNames(dark ? 'bg-night' : 'bg-canvas-subtle');

    return (
        <Stack screenOptions={{ contentStyle: { ...classNames } }}>
            <Stack.Screen
                name='index'
                options={{
                    header: () => (
                        <StackHeader
                            title='Invoices'
                            right={
                                <Pressable
                                    onPress={() => router.push('/(app)/invoices/upload')}
                                    className='size-8 items-center justify-center rounded-lg bg-brand active:opacity-80'
                                    accessibilityLabel='Upload invoice'
                                >
                                    <Icon
                                        name='plus'
                                        size={18}
                                    />
                                </Pressable>
                            }
                        />
                    ),
                }}
            />
            <Stack.Screen
                name='upload'
                options={{
                    header: () => (
                        <StackHeader
                            title='Upload Invoice'
                            left={
                                <Pressable
                                    onPress={() => router.back()}
                                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                                >
                                    <Icon
                                        name='back'
                                        size={20}
                                    />
                                </Pressable>
                            }
                        />
                    ),
                }}
            />
            <Stack.Screen
                name='[id]'
                options={({ route }) => {
                    const params = route.params as { id?: string } | undefined;
                    return {
                        header: () => (
                            <StackHeader
                                title='Invoice Details'
                                left={
                                    <Pressable
                                        onPress={() => router.back()}
                                        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                                    >
                                        <Icon
                                            name='back'
                                            size={20}
                                        />
                                    </Pressable>
                                }
                                right={<DetailHeaderRight invoiceId={params?.id} />}
                            />
                        ),
                    };
                }}
            />
            <Stack.Screen
                name='edit'
                options={{
                    header: () => (
                        <StackHeader
                            title='Edit Invoice'
                            left={
                                <Pressable
                                    onPress={() => router.back()}
                                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                                >
                                    <Icon
                                        name='back'
                                        size={20}
                                    />
                                </Pressable>
                            }
                        />
                    ),
                }}
            />
        </Stack>
    );
}
