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

gulp.task("jsdoc", function () {
    var files, stream

    files = [];
    stream = gulp.src('source/**/*.js');

    console.log('Generating documentation for:');

    stream.on('data', function (_data) {
        var path;
        
        path = _data.path.replace(process.cwd()+'/', '');

        files.push(path);
        console.log('    - ', path);
    });

    stream.on('end', function () {
        var args, cp, dest;

        dest = 'build/docs/';
        args = files.concat('-d', dest);
        cp = spawn('node_modules/.bin/jsdoc', args);

        cp.on('close', function (_code) {
            if (_code === 1) {
                console.log('Complete! Output in', dest);
            } else {
                console.log('jsdoc shell closed with code:', _code);
            }
        });

        cp.on('error', function (_error) {
            console.error(_error);
        });
    });
    
});

gulp.task('jsdoc-watch', function () {
    watch('source/**/*.js', function (_event) {
        var path;

        path = _event.path.replace(process.cwd()+'/', '');

        console.log(path, 'Saved!');
        gulp.start('jsdoc');
    });
});

gulp.task("watch", function() {
    watch('source/**/*.js', function () {
        gulp.start('webpack:build-dev');
    });
});