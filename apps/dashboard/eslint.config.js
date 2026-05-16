// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config';

export default [
    ...tanstackConfig,
    {
        rules: {
            // Disabled: import ordering is handled by @ianvs/prettier-plugin-sort-imports
            // via the root .prettierrc. Keeping both active causes conflicting auto-fixes.
            'import/order': 'off',
            'sort-imports': 'off',
            '@typescript-eslint/consistent-type-imports': 'off',
        },
    },
];
