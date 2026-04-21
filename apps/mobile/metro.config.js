const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// Ensure Metro resolves the `@` alias to the project's `src` directory
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = Object.assign({}, config.resolver.extraNodeModules, {
    '@': path.resolve(__dirname, 'src'),
});

// Also add the project root to watchFolders so Metro picks up local modules
config.watchFolders = Array.from(
    new Set([...(config.watchFolders || []), path.resolve(__dirname, 'src')])
);

module.exports = withUniwindConfig(config, {
    // relative path to your global.css file (from previous step)
    cssEntryFile: './src/app/global.css',
    // (optional) path where we gonna auto-generate typings
    // defaults to project's root
    dtsFile: './uniwind-types.d.ts',
});
