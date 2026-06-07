//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config';

export default [
    ...tanstackConfig,
    {
        ignores: ['eslint.config.js'],
    },
    {
        rules: {
            '@typescript-eslint/no-unnecessary-condition': 'off',
        },
    },
];
