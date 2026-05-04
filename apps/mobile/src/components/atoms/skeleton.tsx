import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewProps } from 'react-native';

export interface SkeletonProps extends ViewProps {
    width?: number | `${number}%`;
    height?: number;
    rounded?: 'sm' | 'md' | 'lg' | 'full';
    className?: string;
}

const roundedMap = {
    sm: 4,
    md: 8,
    lg: 12,
    full: 999,
};

export function Skeleton({
    width,
    height = 16,
    rounded = 'md',
    className,
    style,
    ...props
}: SkeletonProps) {
    const opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                {
                    width: width ?? '100%',
                    height,
                    borderRadius: roundedMap[rounded],
                    opacity,
                    backgroundColor: '#e3e8ee',
                },
                style,
            ]}
            className={className}
            accessibilityLabel='Loading'
            {...props}
        />
    );
}

export function InvoiceCardSkeleton() {
    return (
        <View className='gap-3 rounded-xl border border-wire bg-canvas p-4 dark:border-wire-night dark:bg-night-subtle'>
            <View className='flex-row items-start justify-between'>
                <View className='flex-1 gap-2'>
                    <Skeleton
                        width='55%'
                        height={14}
                    />
                    <Skeleton
                        width='35%'
                        height={12}
                    />
                </View>
                <Skeleton
                    width={64}
                    height={22}
                    rounded='sm'
                />
            </View>
            <View className='flex-row items-center justify-between'>
                <Skeleton
                    width='30%'
                    height={12}
                />
                <Skeleton
                    width='25%'
                    height={20}
                />
            </View>
        </View>
    );
}

export function InvoiceDetailCardSkeleton() {
    return (
        <View className='gap-5 pt-4'>
            <View className='gap-2'>
                <Skeleton
                    width='60%'
                    height={22}
                />
                <Skeleton
                    width='35%'
                    height={14}
                />
            </View>
            <View className='flex-row gap-2'>
                <Skeleton
                    width={80}
                    height={24}
                    rounded='sm'
                />
                <Skeleton
                    width={72}
                    height={24}
                    rounded='sm'
                />
            </View>
            <View className='gap-3 rounded-xl border border-wire bg-canvas p-4 dark:border-wire-night dark:bg-night-subtle'>
                {[1, 2, 3, 4].map((i) => (
                    <View
                        key={i}
                        className='flex-row items-center justify-between'
                    >
                        <Skeleton
                            width='30%'
                            height={13}
                        />
                        <Skeleton
                            width='25%'
                            height={13}
                        />
                    </View>
                ))}
            </View>
            <View className='gap-3 rounded-xl border border-wire bg-canvas p-4 dark:border-wire-night dark:bg-night-subtle'>
                {[1, 2, 3].map((i) => (
                    <View
                        key={i}
                        className='flex-row items-center justify-between'
                    >
                        <Skeleton
                            width='28%'
                            height={13}
                        />
                        <Skeleton
                            width='40%'
                            height={13}
                        />
                    </View>
                ))}
            </View>
            <View className='gap-2 rounded-xl border border-wire bg-canvas p-4 dark:border-wire-night dark:bg-night-subtle'>
                <Skeleton
                    width='40%'
                    height={14}
                />
                <Skeleton
                    width='100%'
                    height={13}
                />
                <Skeleton
                    width='80%'
                    height={13}
                />
            </View>
        </View>
    );
}
