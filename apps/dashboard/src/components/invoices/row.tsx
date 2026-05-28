import type { ReactNode } from 'react';
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';

interface RowProps {
    label: string;
    children: ReactNode;
}

export function Row({ label, children }: RowProps) {
    return (
        <Item className='border-0 px-0 py-0.5'>
            <ItemContent className='flex-row items-center justify-between gap-4'>
                <ItemDescription className='shrink-0 text-sm'>{label}</ItemDescription>
                <ItemTitle className='text-right text-sm font-medium'>{children}</ItemTitle>
            </ItemContent>
        </Item>
    );
}
