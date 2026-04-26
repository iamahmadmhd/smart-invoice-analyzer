module.exports = {
    root: true,
    extends: ['eslint:recommended'],
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
    },
    env: {
        node: true,
        es2021: true,
        browser: true,
    },
    ignorePatterns: ['node_modules/', 'dist/', 'build/'],
    rules: {},
};
