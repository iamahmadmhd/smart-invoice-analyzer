import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PageLoaderProps {
    /** Optional override message. If omitted, cycles through invoice-specific phases. */
    message?: string;
    className?: string;
}

// ── Scan phases ───────────────────────────────────────────────────────────────

const PHASES: Array<{ at: number; text: string }> = [
    { at: 0.0, text: 'Reading document…' },
    { at: 0.22, text: 'Extracting vendor info…' },
    { at: 0.42, text: 'Parsing line items…' },
    { at: 0.6, text: 'Calculating totals…' },
    { at: 0.78, text: 'Checking for anomalies…' },
    { at: 0.92, text: 'Almost done…' },
];

// Field rows: [labelWidth, valueWidth, revealThreshold]
const FIELDS: Array<[number, number, number]> = [
    [54, 90, 0.08],
    [54, 120, 0.2],
    [54, 70, 0.35],
    [54, 105, 0.5],
    [54, 80, 0.63],
];

const CYCLE_MS = 2800;
const PAPER_H = 190; // px — must match CSS height

function easeInOut(t: number) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PageLoader({ message, className }: PageLoaderProps) {
    const rafRef = useRef<number>(0);
    const startRef = useRef<number | null>(null);
    const loopRef = useRef(0);
    const lastPhaseRef = useRef(-1);
    const revealedRef = useRef(new Set<number>());

    const scanLineRef = useRef<HTMLDivElement>(null);
    const scanGlowRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    const [statusText, setStatusText] = useState('Reading document…');
    const [revealedFields, setRevealedFields] = useState(new Set<number>());
    const [amountRevealed, setAmountRevealed] = useState(false);

    useEffect(() => {
        function reset() {
            revealedRef.current = new Set();
            lastPhaseRef.current = -1;
            setRevealedFields(new Set());
            setAmountRevealed(false);
        }

        function tick(ts: number) {
            if (!startRef.current) startRef.current = ts;
            const elapsed = ts - startRef.current;
            const raw = (elapsed % CYCLE_MS) / CYCLE_MS;
            const t = easeInOut(raw);
            const y = Math.round(t * PAPER_H);

            // Move scan elements
            if (scanLineRef.current) scanLineRef.current.style.transform = `translateY(${y}px)`;
            if (scanGlowRef.current)
                scanGlowRef.current.style.transform = `translateY(${y - 10}px)`;
            if (progressRef.current)
                progressRef.current.style.width = `${Math.min(Math.round(raw * 100), 98)}%`;

            // Loop reset
            const newLoop = Math.floor(elapsed / CYCLE_MS);
            if (newLoop > loopRef.current) {
                loopRef.current = newLoop;
                reset();
            }

            // Reveal fields
            let fieldsDirty = false;
            for (const [, , threshold, idx] of FIELDS.map(
                (f, i) => [...f, i] as [number, number, number, number]
            )) {
                if (raw >= threshold && !revealedRef.current.has(idx)) {
                    revealedRef.current.add(idx);
                    fieldsDirty = true;
                }
            }
            if (fieldsDirty) setRevealedFields(new Set(revealedRef.current));

            // Amount block
            if (raw >= 0.76) setAmountRevealed(true);

            // Phase text
            if (!message) {
                let phaseIdx = -1;
                for (let i = PHASES.length - 1; i >= 0; i--) {
                    if (raw >= PHASES[i].at) {
                        phaseIdx = i;
                        break;
                    }
                }
                if (phaseIdx !== lastPhaseRef.current) {
                    lastPhaseRef.current = phaseIdx;
                    if (phaseIdx >= 0) setStatusText(PHASES[phaseIdx].text);
                }
            }

            rafRef.current = requestAnimationFrame(tick);
        }

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [message]);

    return (
        <div
            className={cn('flex min-h-svh flex-col items-center justify-center gap-8', className)}
            aria-label='Loading invoice'
            role='status'
        >
            {/* ── Document stage ────────────────────────────────────────── */}
            <div className='relative h-[190px] w-[260px]'>
                {/* Paper */}
                <div className='absolute inset-0 overflow-hidden rounded-md border border-wire bg-canvas-subtle dark:bg-canvas-inset'>
                    {/* Skeleton fields */}
                    <div className='absolute top-[18px] right-[20px] left-[20px] flex flex-col gap-[10px]'>
                        {FIELDS.map(([labelW, valueW], i) => (
                            <div
                                key={i}
                                className={cn(
                                    'flex items-center gap-[10px] transition-[opacity,transform] duration-300 ease-out',
                                    revealedFields.has(i)
                                        ? 'translate-y-0 opacity-100'
                                        : 'translate-y-[2px] opacity-0'
                                )}
                            >
                                <div
                                    className='h-[6px] shrink-0 rounded-full bg-wire'
                                    style={{ width: labelW }}
                                />
                                <div
                                    className='h-[6px] rounded-full bg-brand-muted opacity-50'
                                    style={{ maxWidth: valueW, flex: 1 }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className='absolute top-[108px] right-[20px] left-[20px] h-px bg-wire' />

                    {/* Amount block */}
                    <div
                        className={cn(
                            'absolute right-[20px] bottom-[18px] flex flex-col items-end gap-[5px] transition-opacity duration-400 ease-out',
                            amountRevealed ? 'opacity-100' : 'opacity-0'
                        )}
                    >
                        <div className='h-[5px] w-[40px] rounded-full bg-wire' />
                        <div className='h-[9px] w-[70px] rounded bg-brand opacity-65' />
                    </div>

                    {/* Corner fold */}
                    <div className='absolute top-0 right-0 h-[18px] w-[18px] rounded-bl-sm border-b border-l border-wire bg-canvas-subtle dark:bg-canvas-inset' />

                    {/* Scan glow */}
                    <div
                        ref={scanGlowRef}
                        className='pointer-events-none absolute right-[-2px] left-[-2px] h-[32px]'
                        style={{
                            background:
                                'linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--brand) 10%, transparent) 40%, color-mix(in srgb, var(--brand) 5%, transparent) 75%, transparent 100%)',
                        }}
                    />

                    {/* Scan line */}
                    <div
                        ref={scanLineRef}
                        className='pointer-events-none absolute right-[-2px] left-[-2px] h-[2px] rounded-full bg-brand opacity-90'
                    />
                </div>
            </div>

            {/* ── Progress + status ────────────────────────────────────── */}
            <div className='flex w-[260px] flex-col items-center gap-3'>
                {/* Progress track */}
                <div className='h-[2px] w-full overflow-hidden rounded-full bg-wire'>
                    <div
                        ref={progressRef}
                        className='h-full rounded-full bg-brand transition-[width] duration-300 ease-out'
                        style={{ width: '0%' }}
                    />
                </div>

                {/* Dots + text */}
                <div className='flex items-center gap-2.5'>
                    <Dots />
                    <span className='min-w-[170px] text-[13px] text-ink-faint'>
                        {message ?? statusText}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ── Pulsing dots ──────────────────────────────────────────────────────────────

function Dots() {
    return (
        <span
            className='flex gap-[5px]'
            aria-hidden
        >
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className='size-[5px] rounded-full bg-brand'
                    style={{
                        animation: 'dotPulse 1.4s ease-in-out infinite',
                        animationDelay: `${i * 0.2}s`,
                    }}
                />
            ))}
            <style>{`
                @keyframes dotPulse {
                    0%,80%,100% { opacity:.2; transform:scale(.9); }
                    40%         { opacity:.9; transform:scale(1.1); }
                }
            `}</style>
        </span>
    );
}
