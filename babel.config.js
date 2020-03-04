module.exports = {
    presets: ['@babel/preset-env', '@babel/preset-react'],
    plugins: [
        ['@babel/plugin-proposal-class-properties', {loose: true}],
        '@babel/plugin-transform-destructuring',
        ['@babel/plugin-proposal-object-rest-spread', {loose: true}]
    ]
};
