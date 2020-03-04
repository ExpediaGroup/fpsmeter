'use strict';
// Grab the env in the same fashion as Babel core
const env = process.env.BABEL_ENV || 'default';
const presetReact = require('@babel/preset-react');

// Define shared configuration
const DEFAULT_PLUGINS = [
    ['@babel/plugin-proposal-class-properties', {loose: true}],
    '@babel/plugin-transform-destructuring',
    ['@babel/plugin-proposal-object-rest-spread', {loose: true}]
];
const PRESET_ENV_CONFIG = {
    loose: true
};
const PRESET_ENV_CONFIG_MOD_FALSE = {
    ...PRESET_ENV_CONFIG,
    modules: false
};
const TRANSFORM_IMPORT_CONFIG = {
    original: '^(.+?)\\.less$',
    replacement: '$1.css'
};

const environments = {
    default: {
        presets: [
            [require.resolve('@babel/preset-env'), PRESET_ENV_CONFIG],
            presetReact
        ],
        plugins: DEFAULT_PLUGINS,
        comments: false
    },
    esm: {
        presets: [
            [require.resolve('@babel/preset-env'), PRESET_ENV_CONFIG_MOD_FALSE],
            presetReact
        ],
        plugins: [
            ...DEFAULT_PLUGINS,
            ['transform-rename-import', TRANSFORM_IMPORT_CONFIG]
        ],
        comments: false
    },
    modern: {
        presets: [
            [require.resolve('@babel/preset-env'), PRESET_ENV_CONFIG],
            presetReact
        ],
        plugins: [
            ...DEFAULT_PLUGINS,
            ['transform-rename-import', TRANSFORM_IMPORT_CONFIG]
        ],
        comments: false
    },
    umd: {
        presets: [
            [require.resolve('@babel/preset-env'), PRESET_ENV_CONFIG_MOD_FALSE],
            presetReact
        ],
        plugins: DEFAULT_PLUGINS,
        comments: false
    }
};

module.exports = (api) => {
    api.cache(false);
    return environments[env];
};
