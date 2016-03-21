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
                'BABEL_ENV': JSON.stringify('production'),
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            mangle: {},
            sourceMap: false,
            compressor: {
                warnings: false
            }
        }),
        new webpack.optimize.AggressiveMergingPlugin()
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

