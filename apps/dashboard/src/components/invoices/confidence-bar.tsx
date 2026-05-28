import { cn } from '@/lib/utils';

interface ConfidenceBarProps {
    score: number;
}

export function ConfidenceBar({ score }: ConfidenceBarProps) {
    const pct = Math.round(score * 100);
    const color = score >= 0.8 ? 'bg-jade' : score >= 0.5 ? 'bg-amber' : 'bg-crimson';
    const textColor = score >= 0.8 ? 'text-jade' : score >= 0.5 ? 'text-amber' : 'text-crimson';
    return (
        <div className='flex flex-col gap-1.5 py-0.5'>
            <div className='flex justify-between'>
                <span className='text-sm text-ink-muted'>AI Confidence</span>
                <span className={cn('text-xs font-semibold tabular-nums', textColor)}>{pct}%</span>
            </div>
            <div className='h-1.5 w-full overflow-hidden rounded-full bg-wire'>
                <div
                    className={cn('h-full rounded-full transition-all duration-500', color)}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
