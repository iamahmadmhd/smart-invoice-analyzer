import './global.css';
import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const Index = () => {
    return (
        <ScrollView className='flex-1 bg-gray-100 py-safe-or-10'>
            {/* Layout & Flexbox */}
            <View className='p-4'>
                <Text className='mb-4 text-2xl font-bold text-gray-800'>Layout & Flexbox</Text>

                <View className='mb-4 flex flex-row items-center justify-between rounded-lg bg-white p-4'>
                    <View className='h-16 w-16 rounded bg-red-500'></View>
                    <View className='h-16 w-16 rounded bg-blue-500'></View>
                    <View className='h-16 w-16 rounded bg-green-500'></View>
                </View>

                <View className='mb-4 flex flex-col items-center rounded-lg bg-white p-4'>
                    <View className='mb-2 h-12 w-full rounded bg-purple-500'></View>
                    <View className='mb-2 h-12 w-3/4 rounded bg-yellow-500'></View>
                    <View className='h-12 w-1/2 rounded bg-pink-500'></View>
                </View>

                <View className='mb-4 flex flex-row flex-wrap justify-center rounded-lg bg-white p-4'>
                    <View className='m-2 h-20 w-20 rounded bg-indigo-500'></View>
                    <View className='m-2 h-20 w-20 rounded bg-teal-500'></View>
                    <View className='m-2 h-20 w-20 rounded bg-orange-500'></View>
                    <View className='m-2 h-20 w-20 rounded bg-cyan-500'></View>
                </View>
            </View>

            {/* Spacing */}
            <View className='px-4'>
                <Text className='mb-4 text-2xl font-bold text-gray-800'>Spacing</Text>

                <View className='mb-4 rounded-lg bg-white'>
                    <View className='bg-red-100 p-1'>
                        <Text className='text-xs'>p-1</Text>
                    </View>
                    <View className='bg-red-200 p-2'>
                        <Text className='text-xs'>p-2</Text>
                    </View>
                    <View className='bg-red-300 p-4'>
                        <Text className='text-xs'>p-4</Text>
                    </View>
                    <View className='bg-red-400 p-8'>
                        <Text className='text-xs'>p-8</Text>
                    </View>
                </View>

                <View className='mb-4 rounded-lg bg-white'>
                    <View className='m-1 bg-blue-100 p-2'>
                        <Text className='text-xs'>m-1</Text>
                    </View>
                    <View className='m-2 bg-blue-200 p-2'>
                        <Text className='text-xs'>m-2</Text>
                    </View>
                    <View className='m-4 bg-blue-300 p-2'>
                        <Text className='text-xs'>m-4</Text>
                    </View>
                </View>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <View className='bg-green-200 pt-4 pr-8 pb-2 pl-6'>
                        <Text className='text-xs'>pt-4 pb-2 pl-6 pr-8</Text>
                    </View>
                </View>
            </View>

            {/* Sizing */}
            <View className='px-4'>
                <Text className='mb-4 text-2xl font-bold text-gray-800'>Sizing</Text>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <View className='mb-2 h-8 w-full rounded bg-purple-300'></View>
                    <View className='mb-2 h-8 w-3/4 rounded bg-purple-400'></View>
                    <View className='mb-2 h-8 w-1/2 rounded bg-purple-500'></View>
                    <View className='mb-2 h-8 w-1/4 rounded bg-purple-600'></View>
                </View>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <View className='mb-2 h-4 w-16 rounded bg-yellow-300'></View>
                    <View className='mb-2 h-6 w-24 rounded bg-yellow-400'></View>
                    <View className='mb-2 h-8 w-32 rounded bg-yellow-500'></View>
                    <View className='h-12 w-48 rounded bg-yellow-600'></View>
                </View>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <View className='max-h-24 min-h-0 max-w-xs min-w-0 rounded bg-teal-300 p-4'>
                        <Text className='text-xs'>min-w-0 min-h-0 max-w-xs max-h-24</Text>
                    </View>
                </View>
            </View>

            {/* Typography */}
            <View className='px-4'>
                <Text className='mb-4 text-2xl font-bold text-gray-800'>Typography</Text>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <Text className='mb-2 text-xs'>text-xs: The quick brown fox</Text>
                    <Text className='mb-2 text-sm'>text-sm: The quick brown fox</Text>
                    <Text className='mb-2 text-base'>text-base: The quick brown fox</Text>
                    <Text className='mb-2 text-lg'>text-lg: The quick brown fox</Text>
                    <Text className='mb-2 text-xl'>text-xl: The quick brown fox</Text>
                    <Text className='mb-2 text-2xl'>text-2xl: The quick brown fox</Text>
                    <Text className='mb-2 text-3xl'>text-3xl: The quick brown fox</Text>
                </View>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <Text className='mb-2 font-thin'>font-thin: Thin weight</Text>
                    <Text className='mb-2 font-light'>font-light: Light weight</Text>
                    <Text className='mb-2 font-normal'>font-normal: Normal weight</Text>
                    <Text className='mb-2 font-medium'>font-medium: Medium weight</Text>
                    <Text className='mb-2 font-semibold'>font-semibold: Semibold weight</Text>
                    <Text className='mb-2 font-bold'>font-bold: Bold weight</Text>
                    <Text className='mb-2 font-extrabold'>font-extrabold: Extra bold weight</Text>
                </View>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <Text className='mb-2 text-left'>text-left: Left aligned text</Text>
                    <Text className='mb-2 text-center'>text-center: Center aligned text</Text>
                    <Text className='mb-2 text-right'>text-right: Right aligned text</Text>
                    <Text className='mb-2 text-justify'>
                        text-justify: Justified text that should wrap to multiple lines to
                        demonstrate the justify alignment behavior in React Native.
                    </Text>
                </View>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <Text className='mb-2 italic'>italic: Italic text style</Text>
                    <Text className='mb-2 not-italic'>not-italic: Not italic text style</Text>
                    <Text className='mb-2 underline'>underline: Underlined text</Text>
                    <Text className='mb-2 line-through'>line-through: Line through text</Text>
                    <Text className='mb-2 no-underline'>no-underline: No underline text</Text>
                </View>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <Text className='mb-2 uppercase'>uppercase: uppercase text</Text>
                    <Text className='mb-2 lowercase'>LOWERCASE: lowercase text</Text>
                    <Text className='mb-2 capitalize'>capitalize: capitalize text</Text>
                    <Text className='mb-2 normal-case'>normal-case: Normal case text</Text>
                </View>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <Text className='mb-2 leading-none'>
                        leading-none: Line height none. This text should have tight line spacing
                        when it wraps to multiple lines.
                    </Text>
                    <Text className='mb-2 leading-tight'>
                        leading-tight: Line height tight. This text should have tight line spacing
                        when it wraps to multiple lines.
                    </Text>
                    <Text className='mb-2 leading-normal'>
                        leading-normal: Line height normal. This text should have normal line
                        spacing when it wraps to multiple lines.
                    </Text>
                    <Text className='mb-2 leading-relaxed'>
                        leading-relaxed: Line height relaxed. This text should have relaxed line
                        spacing when it wraps to multiple lines.
                    </Text>
                    <Text className='mb-2 leading-loose'>
                        leading-loose: Line height loose. This text should have loose line spacing
                        when it wraps to multiple lines.
                    </Text>
                </View>
            </View>

            {/* Colors */}
            <View className='px-4'>
                <Text className='mb-4 text-2xl font-bold text-gray-800'>Colors</Text>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <Text className='mb-1 text-red-500'>text-red-500</Text>
                    <Text className='mb-1 text-blue-500'>text-blue-500</Text>
                    <Text className='mb-1 text-green-500'>text-green-500</Text>
                    <Text className='mb-1 text-yellow-500'>text-yellow-500</Text>
                    <Text className='mb-1 text-purple-500'>text-purple-500</Text>
                    <Text className='mb-1 text-pink-500'>text-pink-500</Text>
                    <Text className='mb-1 text-indigo-500'>text-indigo-500</Text>
                    <Text className='mb-1 text-gray-500'>text-gray-500</Text>
                </View>

                <View className='mb-4 flex flex-row flex-wrap rounded-lg bg-white p-4'>
                    <View className='m-1 h-12 w-12 rounded bg-red-100'></View>
                    <View className='m-1 h-12 w-12 rounded bg-red-300'></View>
                    <View className='m-1 h-12 w-12 rounded bg-red-500'></View>
                    <View className='m-1 h-12 w-12 rounded bg-red-700'></View>
                    <View className='m-1 h-12 w-12 rounded bg-red-900'></View>
                </View>

                <View className='mb-4 flex flex-row flex-wrap rounded-lg bg-white p-4'>
                    <View className='m-1 h-12 w-12 rounded bg-blue-100'></View>
                    <View className='m-1 h-12 w-12 rounded bg-blue-300'></View>
                    <View className='m-1 h-12 w-12 rounded bg-blue-500'></View>
                    <View className='m-1 h-12 w-12 rounded bg-blue-700'></View>
                    <View className='m-1 h-12 w-12 rounded bg-blue-900'></View>
                </View>

                <View className='mb-4 flex flex-row flex-wrap rounded-lg bg-white p-4'>
                    <View className='m-1 h-12 w-12 rounded bg-green-100'></View>
                    <View className='m-1 h-12 w-12 rounded bg-green-300'></View>
                    <View className='m-1 h-12 w-12 rounded bg-green-500'></View>
                    <View className='m-1 h-12 w-12 rounded bg-green-700'></View>
                    <View className='m-1 h-12 w-12 rounded bg-green-900'></View>
                </View>
            </View>

            {/* Borders */}
            <View className='px-4'>
                <Text className='mb-4 text-2xl font-bold text-gray-800'>Borders</Text>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <View className='mb-4 rounded border border-gray-300 p-4'>
                        <Text>border border-gray-300</Text>
                    </View>
                    <View className='mb-4 rounded border-2 border-red-500 p-4'>
                        <Text>border-2 border-red-500</Text>
                    </View>
                    <View className='mb-4 rounded border-4 border-blue-500 p-4'>
                        <Text>border-4 border-blue-500</Text>
                    </View>
                    <View className='mb-4 rounded border-8 border-green-500 p-4'>
                        <Text>border-8 border-green-500</Text>
                    </View>
                </View>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <View className='mb-4 border-t-4 border-red-500 p-4'>
                        <Text>border-t-4 border-red-500</Text>
                    </View>
                    <View className='mb-4 border-r-4 border-blue-500 p-4'>
                        <Text>border-r-4 border-blue-500</Text>
                    </View>
                    <View className='mb-4 border-b-4 border-green-500 p-4'>
                        <Text>border-b-4 border-green-500</Text>
                    </View>
                    <View className='mb-4 border-l-4 border-yellow-500 p-4'>
                        <Text>border-l-4 border-yellow-500</Text>
                    </View>
                </View>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <View className='mb-4 rounded-none border-2 border-gray-400 p-4'>
                        <Text>rounded-none</Text>
                    </View>
                    <View className='mb-4 rounded-sm border-2 border-gray-400 p-4'>
                        <Text>rounded-sm</Text>
                    </View>
                    <View className='mb-4 rounded border-2 border-gray-400 p-4'>
                        <Text>rounded</Text>
                    </View>
                    <View className='mb-4 rounded-md border-2 border-gray-400 p-4'>
                        <Text>rounded-md</Text>
                    </View>
                    <View className='mb-4 rounded-lg border-2 border-gray-400 p-4'>
                        <Text>rounded-lg</Text>
                    </View>
                    <View className='mb-4 rounded-xl border-2 border-gray-400 p-4'>
                        <Text>rounded-xl</Text>
                    </View>
                    <View className='mb-4 rounded-2xl border-2 border-gray-400 p-4'>
                        <Text>rounded-2xl</Text>
                    </View>
                    <View className='mb-4 rounded-3xl border-2 border-gray-400 p-4'>
                        <Text>rounded-3xl</Text>
                    </View>
                    <View className='mb-4 h-24 w-24 items-center justify-center rounded-full border-2 border-gray-400 p-4'>
                        <Text className='text-center'>rounded-full</Text>
                    </View>
                </View>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <View className='mb-4 rounded-tl-lg border-2 border-gray-400 p-4'>
                        <Text>rounded-tl-lg</Text>
                    </View>
                    <View className='mb-4 rounded-tr-lg border-2 border-gray-400 p-4'>
                        <Text>rounded-tr-lg</Text>
                    </View>
                    <View className='mb-4 rounded-bl-lg border-2 border-gray-400 p-4'>
                        <Text>rounded-bl-lg</Text>
                    </View>
                    <View className='mb-4 rounded-br-lg border-2 border-gray-400 p-4'>
                        <Text>rounded-br-lg</Text>
                    </View>
                </View>
            </View>

            {/* Effects */}
            <View className='px-4'>
                <Text className='mb-4 text-2xl font-bold text-gray-800'>Effects</Text>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <View className='mb-4 rounded bg-blue-500 p-4 opacity-100'>
                        <Text className='text-white'>opacity-100</Text>
                    </View>
                    <View className='mb-4 rounded bg-blue-500 p-4 opacity-75'>
                        <Text className='text-white'>opacity-75</Text>
                    </View>
                    <View className='mb-4 rounded bg-blue-500 p-4 opacity-50'>
                        <Text className='text-white'>opacity-50</Text>
                    </View>
                    <View className='mb-4 rounded bg-blue-500 p-4 opacity-25'>
                        <Text className='text-white'>opacity-25</Text>
                    </View>
                    <View className='mb-4 rounded bg-blue-500 p-4 opacity-0'>
                        <Text className='text-white'>opacity-0 (invisible)</Text>
                    </View>
                </View>
            </View>

            {/* Positioning */}
            <View className='px-4'>
                <Text className='mb-4 text-2xl font-bold text-gray-800'>Positioning</Text>

                <View className='relative mb-4 h-64 rounded-lg bg-white p-4'>
                    <View className='absolute top-0 left-0 h-16 w-16 rounded bg-red-500'>
                        <Text className='p-1 text-xs text-white'>top-0 left-0</Text>
                    </View>
                    <View className='absolute top-0 right-0 h-16 w-16 rounded bg-blue-500'>
                        <Text className='p-1 text-xs text-white'>top-0 right-0</Text>
                    </View>
                    <View className='absolute bottom-0 left-0 h-16 w-16 rounded bg-green-500'>
                        <Text className='p-1 text-xs text-white'>bottom-0 left-0</Text>
                    </View>
                    <View className='absolute right-0 bottom-0 h-16 w-16 rounded bg-yellow-500'>
                        <Text className='p-1 text-xs text-white'>bottom-0 right-0</Text>
                    </View>
                    <View className='absolute top-1/2 left-1/2 -mt-8 -ml-8 h-16 w-16 rounded bg-purple-500'>
                        <Text className='p-1 text-xs text-white'>centered</Text>
                    </View>
                </View>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <View className='relative z-10 mb-4 rounded bg-red-500 p-4'>
                        <Text className='text-white'>z-10 (higher)</Text>
                    </View>
                    <View className='relative z-0 -mt-8 ml-4 rounded bg-blue-500 p-4'>
                        <Text className='text-white'>z-0 (lower)</Text>
                    </View>
                </View>
            </View>

            {/* Interactive Elements */}
            <View className='px-4'>
                <Text className='mb-4 text-2xl font-bold text-gray-800'>Interactive Elements</Text>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <TouchableOpacity className='mb-4 rounded bg-blue-500 p-4'>
                        <Text className='text-center font-semibold text-white'>
                            TouchableOpacity Button
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity className='mb-4 rounded-lg bg-green-500 p-3'>
                        <Text className='text-center text-white'>Green Button</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className='mb-4 rounded-full bg-red-500 p-2'>
                        <Text className='text-center text-sm text-white'>Rounded Button</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className='mb-4 rounded border-2 border-purple-500 p-4'>
                        <Text className='text-center font-semibold text-purple-500'>
                            Outlined Button
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <TextInput
                        className='mb-4 rounded border border-gray-300 p-3'
                        placeholder='Default input'
                    />
                    <TextInput
                        className='mb-4 rounded-lg border-2 border-blue-500 p-3'
                        placeholder='Blue border input'
                    />
                    <TextInput
                        className='mb-4 rounded bg-gray-100 p-3'
                        placeholder='Gray background input'
                    />
                    <TextInput
                        className='mb-4 rounded-full border border-gray-300 p-3'
                        placeholder='Rounded input'
                    />
                </View>
            </View>

            {/* Transform */}
            <View className='px-4'>
                <Text className='mb-4 text-2xl font-bold text-gray-800'>Transform</Text>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <View className='mb-4 w-32 rotate-12 transform rounded bg-red-500 p-4'>
                        <Text className='text-center text-white'>rotate-12</Text>
                    </View>
                    <View className='mb-4 w-32 -rotate-12 transform rounded bg-blue-500 p-4'>
                        <Text className='text-center text-white'>-rotate-12</Text>
                    </View>
                    <View className='mb-4 w-32 rotate-45 transform rounded bg-green-500 p-4'>
                        <Text className='text-center text-white'>rotate-45</Text>
                    </View>
                </View>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <View className='mb-4 w-32 scale-75 transform rounded bg-purple-500 p-4'>
                        <Text className='text-center text-white'>scale-75</Text>
                    </View>
                    <View className='mb-4 w-32 scale-110 transform rounded bg-yellow-500 p-4'>
                        <Text className='text-center text-white'>scale-110</Text>
                    </View>
                    <View className='mb-4 w-32 scale-125 transform rounded bg-pink-500 p-4'>
                        <Text className='text-center text-white'>scale-125</Text>
                    </View>
                </View>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <View className='mb-4 w-32 translate-x-4 transform rounded bg-indigo-500 p-4'>
                        <Text className='text-center text-white'>translate-x-4</Text>
                    </View>
                    <View className='mb-4 w-32 translate-y-4 transform rounded bg-teal-500 p-4'>
                        <Text className='text-center text-white'>translate-y-4</Text>
                    </View>
                    <View className='mb-4 w-32 translate-x-4 translate-y-4 transform rounded bg-orange-500 p-4'>
                        <Text className='text-center text-white'>translate-x-4 translate-y-4</Text>
                    </View>
                </View>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <View className='mb-4 w-32 translate-10 scale-125 rotate-12 transform rounded bg-sky-900 p-4'>
                        <Text className='text-center text-white'>
                            translate-10 rotate-12 scale-125
                        </Text>
                    </View>
                </View>
            </View>

            {/* Images */}
            <View className='mb-8 px-4'>
                <Text className='mb-4 text-2xl font-bold text-gray-800'>Images</Text>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <View className='mb-4 h-48 w-full items-center justify-center rounded bg-gray-300'>
                        <Text className='text-gray-600'>w-full h-48 (Image placeholder)</Text>
                    </View>
                    <View className='mb-4 h-32 w-32 items-center justify-center rounded-full bg-gray-300'>
                        <Text className='text-center text-xs text-gray-600'>
                            w-32 h-32 rounded-full
                        </Text>
                    </View>
                    <View className='mb-4 h-24 w-24 items-center justify-center rounded-lg bg-gray-300'>
                        <Text className='text-center text-xs text-gray-600'>
                            w-24 h-24 rounded-lg
                        </Text>
                    </View>
                </View>
            </View>

            {/* Overflow */}
            <View className='mb-8 px-4'>
                <Text className='mb-4 text-2xl font-bold text-gray-800'>Overflow</Text>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <View className='mb-4 h-16 w-48 overflow-hidden rounded bg-gray-200'>
                        <Text>
                            overflow-hidden: This is a very long text that should be clipped by the
                            container because it exceeds the width and height limits.
                        </Text>
                    </View>
                    <View className='mb-4 h-16 w-48 overflow-visible rounded bg-gray-200'>
                        <Text>
                            overflow-visible: This text might overflow the container boundaries.
                        </Text>
                    </View>
                </View>
            </View>

            {/* Shadows */}
            <View className='px-4'>
                <Text className='mb-4 text-2xl font-bold text-gray-800'>Shadows</Text>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <View className='mx-2 mb-4 rounded bg-white p-4 shadow-sm'>
                        <Text className='text-center'>shadow-sm</Text>
                    </View>
                    <View className='mx-2 mb-4 rounded bg-white p-4 shadow'>
                        <Text className='text-center'>shadow (default)</Text>
                    </View>
                    <View className='mx-2 mb-4 rounded bg-white p-4 shadow-md'>
                        <Text className='text-center'>shadow-md</Text>
                    </View>
                    <View className='mx-2 mb-4 rounded bg-white p-4 shadow-lg'>
                        <Text className='text-center'>shadow-lg</Text>
                    </View>
                    <View className='mx-2 mb-4 rounded bg-white p-4 shadow-xl'>
                        <Text className='text-center'>shadow-xl</Text>
                    </View>
                    <View className='mx-2 mb-4 rounded bg-white p-4 shadow-2xl'>
                        <Text className='text-center'>shadow-2xl</Text>
                    </View>
                    <View className='mx-2 mb-4 rounded bg-gray-200 p-4 shadow-none'>
                        <Text className='text-center'>shadow-none</Text>
                    </View>
                </View>

                {/* Colored Shadows */}
                <View className='mb-4 rounded-lg bg-white p-4'>
                    <Text className='mb-4 text-lg font-semibold text-gray-700'>
                        Colored Shadows
                    </Text>
                    <View className='mx-2 mb-4 rounded bg-white p-4 shadow-lg shadow-red-500/50'>
                        <Text className='text-center'>shadow-lg shadow-red-500/50</Text>
                    </View>
                    <View className='mx-2 mb-4 rounded bg-white p-4 shadow-lg shadow-blue-500/50'>
                        <Text className='text-center'>shadow-lg shadow-blue-500/50</Text>
                    </View>
                    <View className='mx-2 mb-4 rounded bg-white p-4 shadow-lg shadow-green-500/50'>
                        <Text className='text-center'>shadow-lg shadow-green-500/50</Text>
                    </View>
                    <View className='mx-2 mb-4 rounded bg-white p-4 shadow-lg shadow-purple-500/50'>
                        <Text className='text-center'>shadow-lg shadow-purple-500/50</Text>
                    </View>
                    <View className='mx-2 mb-4 rounded bg-white p-4 shadow-xl shadow-black/25'>
                        <Text className='text-center'>shadow-xl shadow-black/25</Text>
                    </View>
                </View>

                {/* Shadow with different elements */}
                <View className='mb-4 rounded-lg bg-white p-4'>
                    <Text className='mb-4 text-lg font-semibold text-gray-700'>
                        Shadows on Different Elements
                    </Text>

                    <TouchableOpacity className='mb-4 rounded bg-blue-500 p-4 shadow-lg'>
                        <Text className='text-center font-semibold text-white'>
                            Button with shadow-lg
                        </Text>
                    </TouchableOpacity>

                    <View className='mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-xl'>
                        <Text className='text-gray-800'>Card with shadow-xl and border</Text>
                        <Text className='mt-2 text-sm text-gray-600'>
                            This looks like a material design card
                        </Text>
                    </View>
                </View>
            </View>

            {/* Ring System */}
            <View className='px-4'>
                <Text className='mb-4 text-2xl font-bold text-gray-800'>Ring System</Text>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <Text className='mb-4 text-lg font-semibold text-gray-700'>Ring Widths</Text>
                    <View className='mb-4 rounded bg-white p-4 ring-1 ring-gray-300'>
                        <Text className='text-center'>ring-1 ring-gray-300</Text>
                    </View>
                    <View className='mb-4 rounded bg-white p-4 ring-2 ring-gray-400'>
                        <Text className='text-center'>ring-2 ring-gray-400</Text>
                    </View>
                    <View className='mb-4 rounded bg-white p-4 ring-4 ring-gray-500'>
                        <Text className='text-center'>ring-4 ring-gray-500</Text>
                    </View>
                    <View className='mb-4 rounded bg-white p-4 ring-8 ring-gray-600'>
                        <Text className='text-center'>ring-8 ring-gray-600</Text>
                    </View>
                    <View className='mb-4 rounded bg-white p-4 ring ring-gray-500'>
                        <Text className='text-center'>ring (default) ring-gray-500</Text>
                    </View>
                </View>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <Text className='mb-4 text-lg font-semibold text-gray-700'>Ring Colors</Text>
                    <View className='mb-4 rounded bg-white p-4 ring-4 ring-red-500'>
                        <Text className='text-center'>ring-4 ring-red-500</Text>
                    </View>
                    <View className='mb-4 rounded bg-white p-4 ring-4 ring-blue-500'>
                        <Text className='text-center'>ring-4 ring-blue-500</Text>
                    </View>
                    <View className='mb-4 rounded bg-white p-4 ring-4 ring-green-500'>
                        <Text className='text-center'>ring-4 ring-green-500</Text>
                    </View>
                    <View className='mb-4 rounded bg-white p-4 ring-4 ring-yellow-500'>
                        <Text className='text-center'>ring-4 ring-yellow-500</Text>
                    </View>
                    <View className='mb-4 rounded bg-white p-4 ring-4 ring-purple-500'>
                        <Text className='text-center'>ring-4 ring-purple-500</Text>
                    </View>
                    <View className='mb-4 rounded bg-white p-4 ring-4 ring-pink-500'>
                        <Text className='text-center'>ring-4 ring-pink-500</Text>
                    </View>
                </View>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <Text className='mb-4 text-lg font-semibold text-gray-700'>Ring Offset</Text>
                    <View className='mb-4 rounded bg-white p-4 ring-4 ring-blue-500 ring-offset-1 ring-offset-white'>
                        <Text className='text-center'>ring-offset-1 ring-offset-white</Text>
                    </View>
                    <View className='mb-4 rounded bg-white p-4 ring-4 ring-blue-500 ring-offset-2 ring-offset-white'>
                        <Text className='text-center'>ring-offset-2 ring-offset-white</Text>
                    </View>
                    <View className='mb-4 rounded bg-white p-4 ring-4 ring-blue-500 ring-offset-4 ring-offset-white'>
                        <Text className='text-center'>ring-offset-4 ring-offset-white</Text>
                    </View>
                    <View className='mb-4 rounded bg-white p-4 ring-4 ring-blue-500 ring-offset-8 ring-offset-white'>
                        <Text className='text-center'>ring-offset-8 ring-offset-white</Text>
                    </View>
                </View>

                <View className='mb-4 rounded-lg bg-gray-100 p-4'>
                    <Text className='mb-4 text-lg font-semibold text-gray-700'>
                        Ring Offset Colors
                    </Text>
                    <View className='mb-4 rounded bg-white p-4 ring-4 ring-blue-500 ring-offset-4 ring-offset-gray-100'>
                        <Text className='text-center'>ring-offset-gray-100</Text>
                    </View>
                    <View className='mb-4 rounded bg-white p-4 ring-4 ring-green-500 ring-offset-4 ring-offset-red-200'>
                        <Text className='text-center'>ring-offset-red-200</Text>
                    </View>
                    <View className='mb-4 rounded bg-white p-4 ring-4 ring-purple-500 ring-offset-4 ring-offset-yellow-200'>
                        <Text className='text-center'>ring-offset-yellow-200</Text>
                    </View>
                </View>

                {/* Ring on Interactive Elements */}
                <View className='mb-4 rounded-lg bg-white p-4'>
                    <Text className='mb-4 text-lg font-semibold text-gray-700'>
                        Ring on Interactive Elements
                    </Text>

                    <TouchableOpacity className='mb-4 rounded bg-blue-500 p-4 ring-2 ring-blue-500 ring-offset-2 ring-offset-white'>
                        <Text className='text-center font-semibold text-white'>
                            Button with Ring
                        </Text>
                    </TouchableOpacity>

                    <TextInput
                        className='mb-4 rounded border-0 p-3 ring-2 ring-purple-500 ring-offset-1 ring-offset-white'
                        placeholder='Input with ring focus state'
                    />

                    <TouchableOpacity className='ring-opacity-50 mb-4 rounded-lg border-2 border-green-500 bg-white p-4 ring-4 ring-green-500'>
                        <Text className='text-center font-semibold text-green-500'>
                            Outlined Button with Ring
                        </Text>
                    </TouchableOpacity>

                    <View className='mb-4 rounded-lg bg-indigo-50 p-4 ring-2 ring-indigo-500 ring-offset-2 ring-offset-white'>
                        <Text className='font-medium text-indigo-800'>Card with Ring Border</Text>
                        <Text className='mt-1 text-sm text-indigo-600'>
                            This creates a nice focus or selection state
                        </Text>
                    </View>
                </View>

                {/* Ring Inset */}
                <View className='mb-4 rounded-lg bg-white p-4'>
                    <Text className='mb-4 text-lg font-semibold text-gray-700'>Ring Inset</Text>
                    <View className='mb-4 rounded bg-blue-100 p-4 ring-4 ring-blue-500 ring-inset'>
                        <Text className='text-center text-blue-800'>ring-inset ring-blue-500</Text>
                    </View>
                    <View className='mb-4 rounded bg-red-100 p-4 ring-4 ring-red-500 ring-inset'>
                        <Text className='text-center text-red-800'>ring-inset ring-red-500</Text>
                    </View>
                    <View className='mb-4 rounded bg-green-100 p-4 ring-8 ring-green-500 ring-inset'>
                        <Text className='text-center text-green-800'>
                            ring-8 ring-inset ring-green-500
                        </Text>
                    </View>
                </View>
            </View>

            {/* Gradients */}
            <View className='mb-8 px-4'>
                <Text className='mb-4 text-2xl font-bold text-gray-800'>Gradients</Text>

                <View className='mb-4 rounded-lg bg-white p-4'>
                    <Text className='mb-4 text-lg font-semibold text-gray-700'>
                        Linear to bottom
                    </Text>
                    <View className='mb-4 h-16 rounded bg-gradient-to-b from-indigo-500 to-pink-500' />
                    <Text className='mb-4 text-lg font-semibold text-gray-700'>
                        Linear to right 3 colors
                    </Text>
                    <View className='mb-4 h-16 rounded bg-gradient-to-r from-indigo-500 via-sky-500 to-pink-500' />
                    <Text className='mb-4 text-lg font-semibold text-gray-700'>
                        Linear to bottom left
                    </Text>
                    <View className='mb-4 h-32 rounded bg-gradient-to-bl from-orange-200 to-red-900' />
                    <Text className='mb-4 text-lg font-semibold text-gray-700'>Linear 150 deg</Text>
                    <View className='mb-4 h-32 rounded bg-linear-150 from-orange-500 to-indigo-600' />
                    <Text className='mb-4 text-lg font-semibold text-gray-700'>
                        Linear custom multiple colors
                    </Text>
                    <View className='mb-4 h-32 rounded bg-linear-[25deg,red_5%,yellow_60%,lime_90%,teal]' />
                </View>
            </View>
        </ScrollView>
    );
};

export default Index;
