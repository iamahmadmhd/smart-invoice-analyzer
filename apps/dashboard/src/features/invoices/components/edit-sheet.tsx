import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import type { Invoice, InvoiceCategory } from '@/api/invoices';
import { updateInvoice } from '@/api/invoices';
import { Button } from '@/components/ui/button';
import { Field, FieldError } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CATEGORY_OPTIONS } from '@/constants/invoice';
import { FormField } from '@/components/forms/FormField';

const editSchema = z.object({
    vendorName: z.string().optional(),
    invoiceNumber: z.string().optional(),
    invoiceDate: z.string().optional(),
    dueDate: z.string().optional(),
    netAmount: z.string().optional(),
    taxRate: z.string().optional(),
    vatIdOrTaxNumber: z.string().optional(),
    category: z.string().optional(),
});

interface EditSheetProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    invoice: Invoice;
    teamId: string;
}

export function EditSheet({ open, onOpenChange, invoice, teamId }: EditSheetProps) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (values: z.infer<typeof editSchema>) =>
            updateInvoice(teamId, invoice.invoiceId, {
                vendorName: values.vendorName || undefined,
                invoiceNumber: values.invoiceNumber || undefined,
                invoiceDate: values.invoiceDate || undefined,
                dueDate: values.dueDate || undefined,
                netAmount: values.netAmount ? parseFloat(values.netAmount) : undefined,
                taxRate: values.taxRate ? parseFloat(values.taxRate) : undefined,
                vatIdOrTaxNumber: values.vatIdOrTaxNumber || undefined,
                category: (values.category as InvoiceCategory) || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoice', teamId, invoice.invoiceId] });
            queryClient.invalidateQueries({ queryKey: ['invoices', teamId] });
            onOpenChange(false);
        },
    });

    const form = useForm({
        defaultValues: {
            vendorName: invoice.vendorName ?? '',
            invoiceNumber: invoice.invoiceNumber ?? '',
            invoiceDate: invoice.invoiceDate ?? '',
            dueDate: invoice.dueDate ?? '',
            netAmount: invoice.netAmount !== undefined ? String(invoice.netAmount) : '',
            taxRate: invoice.taxRate !== undefined ? String(invoice.taxRate) : '',
            vatIdOrTaxNumber: invoice.vatIdOrTaxNumber ?? '',
            category: invoice.category ?? '',
        },
        onSubmit: async ({ value }) => {
            await mutation.mutateAsync(value);
        },
    });

    return (
        <Sheet
            open={open}
            onOpenChange={onOpenChange}
        >
            <SheetContent className='flex flex-col gap-0 overflow-y-auto p-0'>
                <SheetHeader className='px-4 pt-4 pb-2'>
                    <SheetTitle>Edit Invoice</SheetTitle>
                </SheetHeader>

                <form
                    className='flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4'
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                >
                    <form.Field
                        name='vendorName'
                        children={(field) => (
                            <FormField
                                field={field}
                                label='Vendor name'
                                placeholder='Acme GmbH'
                            />
                        )}
                    />

                    <form.Field
                        name='invoiceNumber'
                        children={(field) => (
                            <FormField
                                field={field}
                                label='Invoice number'
                                placeholder='RE-2024-001'
                            />
                        )}
                    />

                    <div className='grid grid-cols-2 gap-3'>
                        <form.Field
                            name='invoiceDate'
                            children={(field) => (
                                <FormField
                                    field={field}
                                    label='Invoice date'
                                    type='date'
                                />
                            )}
                        />
                        <form.Field
                            name='dueDate'
                            children={(field) => (
                                <FormField
                                    field={field}
                                    label='Due date'
                                    type='date'
                                />
                            )}
                        />
                    </div>

                    <Separator />

                    <div className='grid grid-cols-2 gap-3'>
                        <form.Field
                            name='netAmount'
                            children={(field) => (
                                <FormField
                                    field={field}
                                    label='Net amount (€)'
                                    type='number'
                                    placeholder='0.00'
                                    min='0'
                                    step='0.01'
                                />
                            )}
                        />
                        <form.Field
                            name='taxRate'
                            children={(field) => (
                                <FormField
                                    field={field}
                                    label='Tax rate (%)'
                                    type='number'
                                    placeholder='19'
                                    min='0'
                                    max='100'
                                    step='1'
                                />
                            )}
                        />
                    </div>
                    <p className='text-xs text-ink-faint'>
                        Tax amount and total will be recalculated automatically.
                    </p>

                    <Separator />

                    <form.Field
                        name='category'
                        children={(field) => (
                            <Field>
                                <Label htmlFor={field.name}>Category</Label>
                                <Select
                                    value={field.state.value || ''}
                                    onValueChange={field.handleChange}
                                >
                                    <SelectTrigger className='h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-canvas-inset'>
                                        <SelectValue placeholder='No category' />
                                    </SelectTrigger>
                                    <SelectContent position='popper'>
                                        {CATEGORY_OPTIONS.map(([value, label]) => (
                                            <SelectItem
                                                key={value}
                                                value={value}
                                            >
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        )}
                    />

                    <form.Field
                        name='vatIdOrTaxNumber'
                        children={(field) => (
                            <FormField
                                field={field}
                                label='VAT / Tax number'
                                placeholder='DE123456789'
                            />
                        )}
                    />

                    {mutation.isError && (
                        <FieldError>
                            {mutation.error instanceof Error
                                ? mutation.error.message
                                : 'Save failed. Please try again.'}
                        </FieldError>
                    )}
                </form>

                <SheetFooter>
                    <Button
                        variant='outline'
                        onClick={() => onOpenChange(false)}
                        disabled={mutation.isPending}
                    >
                        Cancel
                    </Button>
                    <form.Subscribe
                        selector={(s) => s.isSubmitting}
                        children={(isSubmitting) => (
                            <Button
                                onClick={() => form.handleSubmit()}
                                disabled={isSubmitting || mutation.isPending}
                            >
                                {isSubmitting || mutation.isPending ? 'Saving…' : 'Save changes'}
                            </Button>
                        )}
                    />
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
