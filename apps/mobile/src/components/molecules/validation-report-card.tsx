import { ValidationReport, ValidationWarning } from '@smart-invoice-analyzer/contracts';
import React from 'react';
import { View } from 'react-native';
import { Icon } from '../atoms/icon';
import { Text } from '../atoms/text';

export interface ValidationReportCardProps {
    report: ValidationReport;
}

function WarningRow({ item, isError }: { item: ValidationWarning; isError: boolean }) {
    return (
        <View className='flex-row items-start gap-2.5 py-2'>
            <Icon
                name={isError ? 'error' : 'warning'}
                size={14}
                color={isError ? 'error' : 'warning'}
            />
            <View className='flex-1 gap-0.5'>
                <Text
                    variant='caption'
                    color={isError ? 'error' : 'warning'}
                >
                    {item.message}
                </Text>
                <Text
                    variant='caption'
                    color='tertiary'
                >
                    Invoice: {item.invoiceId.slice(-8)}
                </Text>
            </View>
        </View>
    );
}

export function ValidationReportCard({ report }: ValidationReportCardProps) {
    return (
        <View className='gap-3'>
            {/* Summary row */}
            <View className='flex-row gap-3'>
                <View className='flex-1 items-center rounded-xl border border-wire bg-canvas px-3 py-3 dark:border-wire-night dark:bg-night-subtle'>
                    <Text
                        variant='heading3'
                        color='primary'
                    >
                        {report.eligibleInvoices}
                    </Text>
                    <Text
                        variant='caption'
                        color='secondary'
                    >
                        Eligible
                    </Text>
                </View>
                <View className='flex-1 items-center rounded-xl border border-wire bg-canvas px-3 py-3 dark:border-wire-night dark:bg-night-subtle'>
                    <Text
                        variant='heading3'
                        color={report.skippedInvoices > 0 ? 'warning' : 'primary'}
                    >
                        {report.skippedInvoices}
                    </Text>
                    <Text
                        variant='caption'
                        color='secondary'
                    >
                        Skipped
                    </Text>
                </View>
                <View className='flex-1 items-center rounded-xl border border-wire bg-canvas px-3 py-3 dark:border-wire-night dark:bg-night-subtle'>
                    <Text
                        variant='heading3'
                        color={report.errors.length > 0 ? 'error' : 'primary'}
                    >
                        {report.errors.length}
                    </Text>
                    <Text
                        variant='caption'
                        color='secondary'
                    >
                        Errors
                    </Text>
                </View>
            </View>

            {/* Status banner */}
            <View
                className={`flex-row items-center gap-2.5 rounded-xl border px-4 py-3 ${
                    report.canProceed
                        ? 'border-jade-border bg-jade-subtle dark:border-jade-border/30 dark:bg-jade-night-subtle'
                        : 'border-crimson-border bg-crimson-subtle dark:border-crimson-border/30 dark:bg-crimson-night-subtle'
                }`}
            >
                <Icon
                    name={report.canProceed ? 'success' : 'error'}
                    size={16}
                    color={report.canProceed ? 'success' : 'error'}
                />
                <Text
                    variant='body-small'
                    color={report.canProceed ? 'success' : 'error'}
                >
                    {report.canProceed
                        ? `Ready to export ${report.eligibleInvoices} invoice${report.eligibleInvoices !== 1 ? 's' : ''}`
                        : `${report.errors.length} error${report.errors.length !== 1 ? 's' : ''} must be resolved before exporting`}
                </Text>
            </View>

            {/* Errors */}
            {report.errors.length > 0 && (
                <View className='gap-1'>
                    <Text
                        variant='label'
                        color='secondary'
                    >
                        Errors
                    </Text>
                    <View className='rounded-xl border border-crimson-border bg-crimson-subtle px-4 dark:border-crimson-border/30 dark:bg-crimson-night-subtle'>
                        {report.errors.map((e, i) => (
                            <View key={i}>
                                {i > 0 && <View className='h-px bg-crimson-border/30' />}
                                <WarningRow
                                    item={e}
                                    isError
                                />
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Warnings */}
            {report.warnings.length > 0 && (
                <View className='gap-1'>
                    <Text
                        variant='label'
                        color='secondary'
                    >
                        Warnings
                    </Text>
                    <View className='rounded-xl border border-amber-border bg-amber-subtle px-4 dark:border-amber-border/30 dark:bg-amber-night-subtle'>
                        {report.warnings.map((w, i) => (
                            <View key={i}>
                                {i > 0 && <View className='h-px bg-amber-border/30' />}
                                <WarningRow
                                    item={w}
                                    isError={false}
                                />
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}
