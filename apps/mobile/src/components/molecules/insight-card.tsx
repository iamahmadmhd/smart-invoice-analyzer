import { Insight } from '@smart-invoice-analyzer/contracts';
import React from 'react';
import { View } from 'react-native';
import { Icon, IconName } from '../atoms/icon';
import { Text } from '../atoms/text';

export interface InsightCardProps {
    insight: Insight;
}

interface InsightMeta {
    icon: IconName;
    iconColor: 'brand' | 'warning' | 'error' | 'secondary';
    label: string;
    bgClass: string;
    borderClass: string;
}

const INSIGHT_META: Record<string, InsightMeta> = {
    SUMMARY: {
        icon: 'info',
        iconColor: 'brand',
        label: 'AI Summary',
        bgClass: 'bg-azure-subtle dark:bg-azure-night-subtle',
        borderClass: 'border-azure-border dark:border-azure-border/30',
    },
    DUPLICATE: {
        icon: 'duplicate',
        iconColor: 'warning',
        label: 'Duplicate Detected',
        bgClass: 'bg-amber-subtle dark:bg-amber-night-subtle',
        borderClass: 'border-amber-border dark:border-amber-border/30',
    },
    ANOMALY: {
        icon: 'warning',
        iconColor: 'error',
        label: 'Anomaly Detected',
        bgClass: 'bg-crimson-subtle dark:bg-crimson-night-subtle',
        borderClass: 'border-crimson-border dark:border-crimson-border/30',
    },
    CATEGORY: {
        icon: 'category',
        iconColor: 'secondary',
        label: 'Category',
        bgClass: 'bg-canvas-inset dark:bg-night-inset',
        borderClass: 'border-wire dark:border-wire-night',
    },
};

function renderBody(insight: Insight): string {
    const p = insight.payload;
    switch (insight.type) {
        case 'SUMMARY':
            return typeof p['summary'] === 'string' ? p['summary'] : '';
        case 'DUPLICATE': {
            const id = p['duplicateOfInvoiceId'];
            const reason = p['reason'];
            return [reason, id ? `Duplicate of: ${id}` : ''].filter(Boolean).join('\n');
        }
        case 'ANOMALY': {
            const reasons = p['reasons'];
            if (Array.isArray(reasons)) return reasons.join('\n• ');
            return '';
        }
        case 'CATEGORY':
            return typeof p['category'] === 'string' ? p['category'] : '';
        default:
            return JSON.stringify(p);
    }
}

export function InsightCard({ insight }: InsightCardProps) {
    const meta = INSIGHT_META[insight.type] ?? INSIGHT_META['SUMMARY'];
    const body = renderBody(insight);

    return (
        <View className={`gap-2.5 rounded-xl border p-3.5 ${meta.bgClass} ${meta.borderClass}`}>
            <View className='flex-row items-center gap-2'>
                <Icon
                    name={meta.icon}
                    size={15}
                    color={meta.iconColor}
                />
                <Text
                    variant='label'
                    color={
                        meta.iconColor === 'brand'
                            ? 'brand'
                            : meta.iconColor === 'warning'
                              ? 'warning'
                              : meta.iconColor === 'error'
                                ? 'error'
                                : 'secondary'
                    }
                >
                    {meta.label}
                </Text>
            </View>
            {body ? (
                <Text
                    variant='body-small'
                    color='secondary'
                >
                    {insight.type === 'ANOMALY' && body.includes('\n') ? `• ${body}` : body}
                </Text>
            ) : null}
        </View>
    );
}
