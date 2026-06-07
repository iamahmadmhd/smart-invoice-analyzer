import { IconSparkles } from '@tabler/icons-react';
import type { Insight, SummaryPayload } from '@/api/insights';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InsightCardProps {
    insight: Insight;
}

export function InsightCard({ insight }: InsightCardProps) {
    if (insight.type === 'SUMMARY') {
        const payload = insight.payload as unknown as SummaryPayload;
        return (
            <Card>
                <CardHeader className='border-b'>
                    <CardTitle className='flex items-center gap-2 text-sm'>
                        <IconSparkles
                            size={14}
                            className='text-brand'
                        />
                        AI Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-sm leading-relaxed text-ink-muted'>
                        {payload.summary ?? '—'}
                    </p>
                </CardContent>
            </Card>
        );
    }
    return null;
}
