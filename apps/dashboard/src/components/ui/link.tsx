import { Link as UnstyledLink } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

function Link({ className, ...props }: Parameters<typeof UnstyledLink>[0]) {
    return (
        <UnstyledLink
            className={cn(
                'text-brand underline-offset-4 transition-colors duration-150 hover:text-brand-hover hover:underline',
                className
            )}
            {...props}
        />
    );
}

export { Link };
