var gulp = require('gulp');
var watch = require('gulp-watch');
var gutil = require("gulp-util");
var webpack = require("webpack");
var webpackDevConfig = require("./webpack.config.dev.js");

gulp.task("default", ["build-dev"]); 

gulp.task("build-dev", ["webpack:build-dev"]);

// Production build
gulp.task("build", ["webpack:build"]);

gulp.task("webpack:build", function(callback) {
    // modify some webpack config options
    var myConfig = Object.create(webpackProdConfig);
    myConfig.plugins = myConfig.plugins.concat(
        new webpack.DefinePlugin({
            "process.env": {
                // This has effect on the react lib size
                "NODE_ENV": JSON.stringify("production")
            }
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin()
    );

    // run webpack
    webpack(myConfig, function(err, stats) {
        if(err) throw new gutil.PluginError("webpack:build", err);
        gutil.log("[webpack:build]", stats.toString({
            colors: true
        }));
        callback();
    });
});

gulp.task("webpack:build-dev", function(callback) {
    webpack(Object.create(webpackDevConfig)).run(function(err, stats) {
        if(err) throw new gutil.PluginError("webpack:build-dev", err);
        gutil.log("[webpack:build-dev]", stats.toString({
            colors: true
        }));
        callback();
    });
});

gulp.task("watch", function(callback) {
    watch('source/**/*.js', function () {
        gulp.start('webpack:build-dev');
    });
});