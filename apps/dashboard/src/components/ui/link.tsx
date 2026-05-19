import { cn } from '@/lib/utils';
import { Link as UnstyledLink } from '@tanstack/react-router';

function Link({ className, ...props }: Parameters<typeof UnstyledLink>[0]) {
    return (
        <UnstyledLink
            className={cn(['underline underline-offset-4 hover:text-brand', className])}
            {...props}
        />
    );
}

export { Link };
