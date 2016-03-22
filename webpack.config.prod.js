var path = require('path');
var webpack = require('webpack');

module.exports = {
    devtool: 'source-map',
    resolve: {
        root: path.resolve('./source'),
        extensions: ['', '.js']
    },
    entry: ['./source/main.js'],
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'BABEL_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            mangle: false,
            sourceMap: true,
            compress: {
                unused: false,
                warnings: false
            }
        })
    ],
    output: {
        path: path.join(__dirname, 'build'),
        filename: 'play.js',
        publicPath: '/build/'
    },
    module: {
        loaders: [{
            test: /\.js$/,
            loaders: ['babel'],
            include: path.join(__dirname, 'source')
        }]
    }
};

