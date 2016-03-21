var path = require('path');
var webpack = require('webpack');

module.exports = {
    devtool: 'cheap-source-map',
    resolve: {
        root: path.resolve('./source'),
        extensions: ['', '.js']
    },
    entry: ['./source/main.js'],
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

