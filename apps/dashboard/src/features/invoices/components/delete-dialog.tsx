import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type { Invoice } from '@/api/invoices';
import { deleteInvoice } from '@/api/invoices';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface DeleteDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    invoice: Invoice;
    teamId: string;
}

export function DeleteDialog({ open, onOpenChange, invoice, teamId }: DeleteDialogProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: () => deleteInvoice(teamId, invoice.invoiceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices', teamId] });
            navigate({ to: '/$teamId/invoices', params: { teamId } });
        },
    });

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete invoice?</DialogTitle>
                    <DialogDescription>
                        This will permanently delete the invoice
                        {invoice.vendorName ? ` from ${invoice.vendorName}` : ''}. This action
                        cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                {mutation.isError && (
                    <p className='text-sm text-crimson'>
                        {mutation.error instanceof Error
                            ? mutation.error.message
                            : 'Delete failed. Try again.'}
                    </p>
                )}
                <DialogFooter>
                    <Button
                        variant='outline'
                        onClick={() => onOpenChange(false)}
                        disabled={mutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant='destructive'
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? 'Deleting…' : 'Delete invoice'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
