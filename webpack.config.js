// Copyright 2019 Expedia Group, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SystemBellPlugin = require('system-bell-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
    .BundleAnalyzerPlugin;
const ModuleAnalyzerPlugin = require('webpack-module-analyzer-plugin');
const merge = require('webpack-merge');
const pkg = require('./package.json');
const open = require('open');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const cssnano = require('cssnano');
const TerserPlugin = require('terser-webpack-plugin');
const Visualizer = require('webpack-visualizer-plugin');
const webpack = require('webpack');

// -- Directories------------------------------

const ROOT_PATH = __dirname;
const SRC_DIR = path.join(ROOT_PATH, 'src');
const LIB_DIR = path.join(ROOT_PATH, 'lib');
const PAGES_DIR = path.join(ROOT_PATH, 'pages');
const DOCS_SRC_DIR = path.join(PAGES_DIR, 'harness');
const DOCS_OUT_DIR = path.join(ROOT_PATH, 'docs');

const devMode = process.env.NODE_ENV !== 'production';

// -- External Libraries -----------------------

// libs that should be provided by the host application
// and not packaged with the final build.
const externals = ['react', 'react-dom', 'classnames', 'prop-types'];

// -- Common configuration for all targets -------

const commonConfig = {
    resolve: {
        extensions: ['.js', '.less', '.json'],
        modules: ['node_modules']
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules|tests/
            },
            {
                test: /\.less$/,
                use: [
                    devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            ident: 'postcss',
                            plugins: [cssnano({safe: true})]
                        }
                    },
                    {
                        loader: 'less-loader'
                    }
                ]
            },
            {
                test: /\.css$/,
                loaders: ['style-loader', 'css-loader']
            },
            {
                test: /\.png$/,
                loader: 'url-loader?limit=100000&mimetype=image/png'
            },
            {
                test: /\.jpg$/,
                loader: 'file-loader'
            },
            {
                test: /\.svg$/,
                loader: 'url-loader?limit=100000'
            },
            {
                test: /\.eot$/,
                loader: 'url-loader?limit=100000'
            },
            {
                test: /\.ttf$/,
                loader: 'url-loader?limit=100000'
            },
            {
                test: /\.js$/,
                loader: 'eslint-loader',
                query: {
                    emitWarning: true,
                    quiet: true
                },
                exclude: /node_modules|tests/
            }
        ]
    },
    plugins: [new SystemBellPlugin()]
};

// -- Local development config --------------------

// This sets up a webpack dev server.
// It is used for running the UI locally for the development harness.
const devConfig = merge(commonConfig, {
    mode: 'development',
    devtool: 'eval-source-map',
    plugins: [
        new HtmlWebpackPlugin({
            hash: true,
            title: `${pkg.name} - ${pkg.description}`,
            template: path.join(PAGES_DIR, 'index.html')
        })
    ],
    devServer: {
        port: 8000,
        host: '0.0.0.0',
        stats: 'errors-only',
        allowedHosts: []
    }
});

// Every component deserves an examples page with expanded documentation.
// Use the "pages/docs" directory to compose this documentation. The config
// below produces the documentation assets including an html file. This
// config is run as part of the build process in Quickbuild when publishing
// your module, after the real module assets are produced.
const buildDocsConfig = merge(commonConfig, {
    devtool: 'source-map',
    entry: path.join(DOCS_SRC_DIR, 'harness.js'),
    output: {
        path: DOCS_OUT_DIR,
        filename: 'docs.js'
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {NODE_ENV: JSON.stringify('production')}
        }),
        new ModuleAnalyzerPlugin(),
        new HtmlWebpackPlugin({
            prerender: true,
            inject: true,
            title: `${pkg.name} - ${pkg.description}`,
            template: path.join(PAGES_DIR, 'index.html')
        })
    ],
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    parse: {
                        // we want to parse ecma 8 code. However, we don't want it
                        // to apply any minfication steps that turns valid ecma 5 code
                        // into invalid ecma 5 code. This is why the 'compress' and 'output'
                        // sections only apply transformations that are ecma 5 safe
                        // https://github.com/facebook/create-react-app/pull/4234
                        ecma: 8
                    },
                    compress: {
                        ecma: 5,
                        warnings: false,
                        // Disabled because of an issue with Uglify breaking seemingly valid code:
                        // https://github.com/facebook/create-react-app/issues/2376
                        // Pending further investigation:
                        // https://github.com/mishoo/UglifyJS2/issues/2011
                        comparisons: false
                    },
                    mangle: true,
                    output: {
                        ecma: 5,
                        comments: false,
                        // Turned on because emoji and regex is not minified properly using default
                        // https://github.com/facebook/create-react-app/issues/2488
                        ascii_only: true
                    },
                    safari10: true
                },
                // Use multi-process parallel running to improve the build speed
                // Default number of concurrent runs: os.cpus().length - 1
                parallel: true,
                // Enable file caching
                cache: true,
                sourceMap: true
            })
        ]
    }
});

// -- Build final output files ----------------------
// Here we configure the final build when 'npm run build' is called.
// There are two output packages being produced, webpack is only
// producing the one for legacy UMD applications. Here's that config

const buildLibUmdConfig = merge(commonConfig, {
    mode: 'production',
    devtool: 'source-map',
    entry: path.join(SRC_DIR, 'index.js'),
    output: {
        path: path.join(LIB_DIR, 'umd'),
        filename: 'index.min.js'
    },
    externals,
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    parse: {
                        // we want to parse ecma 8 code. However, we don't want it
                        // to apply any minfication steps that turns valid ecma 5 code
                        // into invalid ecma 5 code. This is why the 'compress' and 'output'
                        // sections only apply transformations that are ecma 5 safe
                        // https://github.com/facebook/create-react-app/pull/4234
                        ecma: 8
                    },
                    compress: {
                        ecma: 5,
                        warnings: false,
                        // Disabled because of an issue with Uglify breaking seemingly valid code:
                        // https://github.com/facebook/create-react-app/issues/2376
                        // Pending further investigation:
                        // https://github.com/mishoo/UglifyJS2/issues/2011
                        comparisons: false
                    },
                    mangle: true,
                    output: {
                        ecma: 5,
                        comments: false,
                        // Turned on because emoji and regex is not minified properly using default
                        // https://github.com/facebook/create-react-app/issues/2488
                        ascii_only: true
                    },
                    safari10: true
                },
                // Use multi-process parallel running to improve the build speed
                // Default number of concurrent runs: os.cpus().length - 1
                parallel: true,
                // Enable file caching
                cache: true,
                sourceMap: true
            })
        ]
    },
    plugins: [new ModuleAnalyzerPlugin()]
});

// -- Config for analyze (analyze) -------------------

// Configuration for analyzation of composition
const reportName = 'partition-stats.html';
const reportNameSunburst = reportName + '-sunburst.html';
const analyzeConfig = {
    // Can be `server`, `static` or `disabled`.
    // In `server` mode analyzer will start HTTP server to show bundle report.
    // In `static` mode single HTML file with bundle report will be generated.
    // In `disabled` mode you can use this plugin to just generate Webpack Stats JSON file by setting `generateStatsFile` to `true`.
    analyzerMode: 'static',
    // Port that will be used in `server` mode to start HTTP server.
    analyzerPort: 8888,
    // Path to bundle report file that will be generated in `static` mode.
    // Relative to bundles output directory.
    reportFilename: reportName,
    // Automatically open report in default browser
    openAnalyzer: true,
    // If `true`, Webpack Stats JSON file will be generated in bundles output directory
    generateStatsFile: true,
    // Name of Webpack Stats JSON file that will be generated if `generateStatsFile` is `true`.
    // Relative to bundles output directory.
    statsFilename: 'stats.json',
    // Options for `stats.toJson()` method.
    // For example you can exclude sources of your modules from stats file with `source: false` option.
    // See more options here: https://github.com/webpack/webpack/blob/webpack-1/lib/Stats.js#L21
    statsOptions: null,
    // Log level. Can be 'info', 'warn', 'error' or 'silent'.
    logLevel: 'silent'
};
const buildAnalyzeConfig = merge(buildLibUmdConfig, {
    plugins: [
        new BundleAnalyzerPlugin(analyzeConfig),
        new Visualizer({filename: reportNameSunburst})
    ]
});
// buildAnalyzeConfig.mode = 'development';

if (process.env.npm_lifecycle_event === 'analyze') {
    // side effect for running analyze
    const sunburstFilePath =
        'file://' + buildAnalyzeConfig.output.path + '/' + reportNameSunburst;
    setTimeout(function() {
        open(sunburstFilePath);
    }, 1000);
}

// -- Final configs for each npm run target -------------

// Here we associate the npm run target with a specific config. The targets,
// such as "start" when the "npm start" script command is run, are the keys
// in the following object.
const configs = {
    start: merge(devConfig, {
        entry: path.join(PAGES_DIR, 'harness', 'harness.js')
    }),
    'start:silent': merge(devConfig, {
        entry: path.join(PAGES_DIR, 'harness', 'harness.js')
    }),
    'start:docs': merge(devConfig, {
        entry: path.join(PAGES_DIR, 'harness', 'harness.js')
    }),
    'build:analyze': buildAnalyzeConfig,
    'build:umd': buildLibUmdConfig,
    'build:docs': buildDocsConfig
};

// Export the correct config for the npm run script currently processing
module.exports = configs[process.env.npm_lifecycle_event];
