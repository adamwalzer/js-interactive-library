var gulp = require('gulp'),
    watch = require('gulp-watch'),
    gutil = require("gulp-util"),
    webpack = require("webpack"),
    webpackDevConfig = require("./webpack.config.dev.js"),
    webpackPrdConfig = require("./webpack.config.prod.js"),
    spawn = require('child_process').spawn;

function build (_config, _cb) {
    webpack(_config).run(function(err, stats) {
        if(err) throw new gutil.PluginError("webpack:build-dev", err);
        gutil.log("[webpack:build-dev]", stats.toString({
            colors: true
        }));
        if (_cb) _cb();
    });
}

// Production build
gulp.task("webpack:build", function(callback) { build(webpackPrdConfig, callback) });
gulp.task("build", ["webpack:build"]);

// Development build
gulp.task("webpack:build-dev", function(callback) { build(webpackDevConfig, callback) });
gulp.task("build-dev", ["webpack:build-dev"]);

gulp.task("default", ["build-dev"]); 

gulp.task("jsdoc", function () {
    var files, stream

    files = ['README.md'];
    stream = gulp.src('source/**/*.js');

    console.log('Generating documentation for:');
    console.log('  - README.md');

    stream.on('data', function (_data) {
        var path;
        
        path = _data.path.replace(process.cwd()+'/', '');

        files.push(path);
        console.log('  -', path);
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
    watch(['README.md' ,'source/**/*.js'], function (_event) {
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
