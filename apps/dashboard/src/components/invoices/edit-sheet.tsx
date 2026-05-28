import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import type { Invoice, InvoiceCategory } from '@/api/invoices';
import { updateInvoice } from '@/api/invoices';
import { Button } from '@/components/ui/button';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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

const CATEGORY_LABELS: Record<InvoiceCategory, string> = {
    software: 'Software',
    hardware: 'Hardware',
    office: 'Office',
    travel: 'Travel',
    marketing: 'Marketing',
    utilities: 'Utilities',
    consulting: 'Consulting',
    other: 'Other',
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS) as Array<[InvoiceCategory, string]>;

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
                            <Field>
                                <Label htmlFor={field.name}>Vendor name</Label>
                                <Input
                                    id={field.name}
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder='Acme GmbH'
                                />
                            </Field>
                        )}
                    />

                    <form.Field
                        name='invoiceNumber'
                        children={(field) => (
                            <Field>
                                <Label htmlFor={field.name}>Invoice number</Label>
                                <Input
                                    id={field.name}
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder='RE-2024-001'
                                />
                            </Field>
                        )}
                    />

                    <div className='grid grid-cols-2 gap-3'>
                        <form.Field
                            name='invoiceDate'
                            children={(field) => (
                                <Field>
                                    <Label htmlFor={field.name}>Invoice date</Label>
                                    <Input
                                        id={field.name}
                                        type='date'
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                </Field>
                            )}
                        />
                        <form.Field
                            name='dueDate'
                            children={(field) => (
                                <Field>
                                    <Label htmlFor={field.name}>Due date</Label>
                                    <Input
                                        id={field.name}
                                        type='date'
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                </Field>
                            )}
                        />
                    </div>

                    <Separator />

                    <div className='grid grid-cols-2 gap-3'>
                        <form.Field
                            name='netAmount'
                            children={(field) => (
                                <Field>
                                    <Label htmlFor={field.name}>Net amount (€)</Label>
                                    <Input
                                        id={field.name}
                                        type='number'
                                        min='0'
                                        step='0.01'
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder='0.00'
                                    />
                                </Field>
                            )}
                        />
                        <form.Field
                            name='taxRate'
                            children={(field) => (
                                <Field>
                                    <Label htmlFor={field.name}>Tax rate (%)</Label>
                                    <Input
                                        id={field.name}
                                        type='number'
                                        min='0'
                                        max='100'
                                        step='1'
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder='19'
                                    />
                                </Field>
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
                            <Field>
                                <Label htmlFor={field.name}>VAT / Tax number</Label>
                                <Input
                                    id={field.name}
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder='DE123456789'
                                />
                            </Field>
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
