import { createFileRoute } from '@tanstack/react-router';
import { IconReceipt } from '@tabler/icons-react';

export const Route = createFileRoute('/(app)/$teamId/invoices/')({
    component: InvoicesPage,
});

function InvoicesPage() {
    return (
        <div className='flex flex-1 flex-col'>
            {/* Empty state — replaced in the next step */}
            <div className='flex flex-1 flex-col items-center justify-center gap-3 text-center'>
                <div className='flex size-12 items-center justify-center rounded-xl border border-wire bg-canvas'>
                    <IconReceipt
                        size={22}
                        className='text-ink-faint'
                    />
                </div>
                <div>
                    <p className='text-sm font-medium'>No invoices yet</p>
                    <p className='mt-0.5 text-xs text-ink-muted'>
                        Upload your first invoice from the mobile app
                    </p>
                </div>
            </div>
        </div>
    );
}
