import React from 'react';
import { View } from 'react-native';
import { Text } from '../atoms/text';

export interface InvoiceHeroProps {
    vendorName?: string | null;
    invoiceNumber?: string | null;
}

export function InvoiceHero({ vendorName, invoiceNumber }: InvoiceHeroProps) {
    return (
        <View className='gap-1.5'>
            <Text
                variant='heading3'
                color='primary'
                numberOfLines={2}
            >
                {vendorName ?? 'Unknown Vendor'}
            </Text>
            {invoiceNumber && (
                <Text
                    variant='body-small'
                    color='tertiary'
                >
                    Invoice #{invoiceNumber}
                </Text>
            )}
        </View>
    );
}
