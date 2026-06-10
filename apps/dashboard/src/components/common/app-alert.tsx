import type { ComponentProps, ReactNode } from 'react';
import { AlertDescription, AlertTitle, Alert as UIAlert } from '@/components/ui/alert';
import { Item, ItemContent, ItemDescription } from '@/components/ui/item';

interface AppAlertProps extends ComponentProps<'div'> {
    title?: string;
    description?: string | Array<string>;
    variant?: 'default' | 'danger' | 'destructive';
    icon?: ReactNode;
}

export function AppAlert({
    title,
    description,
    variant = 'default',
    icon,
    ...props
}: AppAlertProps) {
    const reasons = description ? (Array.isArray(description) ? description : [description]) : null;

    return (
        <UIAlert
            variant={variant}
            {...props}
        >
            {icon}
            {title && <AlertTitle>{title}</AlertTitle>}
            {reasons && (
                <AlertDescription>
                    {reasons.map((reason, i) => (
                        <Item
                            key={i}
                            className='p-0'
                        >
                            <ItemContent>
                                <ItemDescription className='line-clamp-none'>
                                    {reason}
                                </ItemDescription>
                            </ItemContent>
                        </Item>
                    ))}
                </AlertDescription>
            )}
        </UIAlert>
    );
}
