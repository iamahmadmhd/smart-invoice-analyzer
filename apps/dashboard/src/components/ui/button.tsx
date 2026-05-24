import { cva } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5",
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground hover:bg-[color:var(--brand-hover)] active:bg-[color:var(--brand-hover)]',
                outline:
                    'border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
                secondary:
                    'bg-secondary text-secondary-foreground hover:bg-muted aria-expanded:bg-muted',

                ghost: 'hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground',

                destructive:
                    'bg-crimson-subtle text-crimson hover:bg-crimson/15 border-crimson-border/60 focus-visible:border-crimson/40 focus-visible:ring-crimson/20 dark:bg-crimson/15 dark:hover:bg-crimson/25 dark:border-crimson/20 dark:focus-visible:ring-crimson/30',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default:
                    'h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
                xs: "h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
                sm: "h-9 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-4",
                lg: 'h-12 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5',
                icon: 'size-10',
                'icon-xs':
                    "size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
                'icon-sm':
                    'size-9 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg',
                'icon-lg': 'size-12',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

function Button({
    className,
    variant = 'default',
    size = 'default',
    asChild = false,
    ...props
}: ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) {
    const Comp = asChild ? Slot.Root : 'button';

    return (
        <Comp
            data-slot='button'
            data-variant={variant}
            data-size={size}
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
