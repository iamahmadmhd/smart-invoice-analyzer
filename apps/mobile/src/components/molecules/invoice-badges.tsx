import { mapInvoiceStatus } from '@/lib/invoice-utils';
import { Invoice } from '@smart-invoice-analyzer/contracts';
import React from 'react';
import { View } from 'react-native';
import { Badge, InvoiceStatusBadge } from '../atoms/badge';

export interface InvoiceBadgesProps {
    status: Invoice['status'];
    duplicateFlag?: boolean;
    anomalyFlag?: boolean;
    exportStatus?: string;
}

export function InvoiceBadges({
    status,
    duplicateFlag,
    anomalyFlag,
    exportStatus,
}: InvoiceBadgesProps) {
    return (
        <View className='flex-row flex-wrap gap-2'>
            <InvoiceStatusBadge status={mapInvoiceStatus(status)} />
            {duplicateFlag && (
                <Badge
                    label='Duplicate'
                    variant='warning'
                    dot
                />
            )}
            {anomalyFlag && (
                <Badge
                    label='Anomaly'
                    variant='error'
                    dot
                />
            )}
            {exportStatus === 'EXPORTED' && (
                <Badge
                    label='Exported'
                    variant='success'
                />
            )}
        </View>
    );
}
