import { AlertDescription, AlertTitle, Alert as UIAlert } from '../ui/alert';
import { Item, ItemContent, ItemDescription } from '../ui/item';
import type { ComponentProps, ReactNode } from 'react';

interface AlertProps extends ComponentProps<'div'> {
    title?: string;
    description?: Array<string>;
    variant?: 'default' | 'danger' | 'destructive';
    icon?: ReactNode;
}

function Alert({ title, description, variant = 'default', icon, ...props }: AlertProps) {
    return (
        <UIAlert
            variant={variant}
            {...props}
        >
            {icon}
            {title && <AlertTitle>{title}</AlertTitle>}
            {description && (
                <AlertDescription>
                    {description.map((reason, i) => (
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

export { Alert };
