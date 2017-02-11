var mode;
var getMode;
var buildDevelopment;
var buildProduction;
var selectBuildMode;

/*global require process*/
/*eslint-env node */
/*eslint no-console:0 */
var gulp = require('gulp');
var args = require('yargs').argv;
var gutil = require('gulp-util');
var webpack = require('webpack');
var gulpWebpack = require('webpack-stream');
var webpackDevConfig = require('./webpack.config.dev.js');
var webpackProdConfig = require('./webpack.config.prod.js');
var appPackage = require('./package.json');
var eslint = require('gulp-eslint');
var fs = require('fs');
var eslintConfigJs = JSON.parse(fs.readFileSync('./.eslintrc'));
var env = require('gulp-env');
var mocha = require('gulp-mocha');

webpackDevConfig.output.filename = 'skoash.' + appPackage.version + '.js';
webpackProdConfig.output.filename = 'skoash.' + appPackage.version + '.js';

require('babel-core/register');//for mocha to use es6

//mode defaults to development and is selected with the following precedences:
// --development flag
// --production flag
// APP_ENV environment variable
// NODE_ENV environment variable
getMode = function (m = 'production') {
    if (args.development || args.dev) {
        m = 'development';
    } else if (args.prod || args.production) {
        m = 'production';
    } else if (process.env.APP_ENV) {
        m = process.env.APP_ENV;
    } else if (process.env.NODE_ENV) {
        m = process.env.NODE_ENV;
    }
    return m;
};

mode = getMode();

/*
___  ______  ______  ______  ______  ______  ______  ______  ______  ______  ______  ______  ______  ___
 __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__
(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)
                                    #1 Build Functions
___  ______  ______  ______  ______  ______  ______  ______  ______  ______  ______  ______  ______  ___
 __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__
(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)
*/

buildDevelopment = function () {
    var wpStream = gulpWebpack(webpackDevConfig, null, function (err, stats) {
        var statsStr = stats.toString({
            colors: true
        });
        if (err) {
            throw new gutil.PluginError('webpack:build-dev', err);
        }
        fs.appendFile('build.log', statsStr);
        gutil.log('[webpack:build-dev]', statsStr);
    });

    fs.writeFile('build_errors.log', '');
    fs.writeFile('build.log', ''); //remove this line to persist logs
    fs.appendFile('build.log', `******************** Build Started in ${mode} mode at ${Date.now()}\r\n`);

    env({
        vars: {
            NODE_ENV: 'development',
            BABEL_ENV: 'development'
        }});
    wpStream.on('error', err => {
        fs.writeFile('build_errors.log', err);
        wpStream.end();
    });
    return gulp.src('./src/app.js')
        .pipe(wpStream)
        .pipe(gulp.dest('./build'))
        .pipe(gulp.dest('../cmwn-games/library/framework'));
};

buildProduction = function () {
    // modify some webpack config options
    var wpStream = gulpWebpack(webpackProdConfig, webpack, function (err, stats) {
        var statsStr = stats.toString({
            colors: true
        });
        if (err) {
            throw new gutil.PluginError('webpack:build', err);
        }
        fs.appendFile('build.log', statsStr);
        gutil.log('[webpack:build]', statsStr);
    });

    wpStream.on('error', err => {
        fs.writeFile('build_errors.log', err);
        wpStream.end();
    });

    fs.writeFile('build_errors.log', '');
    fs.writeFile('build.log', ''); //remove this line to persist logs
    fs.appendFile('build.log', `******************** Build Started in ${mode} mode at ${Date.now()}\r\n`);

    //mark environment as prod
    env({
        vars: {
            NODE_ENV: 'production',
            BABEL_ENV: 'production'
        }});
    // run webpack
    return gulp.src('./src/app.js')
        .pipe(wpStream)
        .pipe(gulp.dest('./build'))
        .pipe(gulp.dest('../cmwn-games/library/framework'));
};

selectBuildMode = function () {

    if (mode === 'production' || mode === 'prod') {
        gutil.log(gutil.colors.green('Building in production mode'));
        process.env.NODE_ENV = 'production';
        process.env.BABEL_ENV = 'production';
        return buildProduction();
    }
    gutil.log(gutil.colors.green('Building in development mode'));
    return buildDevelopment();
};

/*
___  ______  ______  ______  ______  ______  ______  ______  ______  ______  ______  ______  ______  ___
 __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__
(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)
                                    #2 Task Definitions
___  ______  ______  ______  ______  ______  ______  ______  ______  ______  ______  ______  ______  ___
 __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__
(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)
*/

gulp.task('default', ['build', 'watch']);

gulp.task('watch', function () {
    mode = getMode('development');
    gulp.watch('src/**/*.js', ['build']);
});

/*·.·´`·.·•·.·´`·.·•·.·´`·.·•·.·´JS Build Tasks`·.·•·.·´`·.·•·.·´`·.·•·.·´`·.·•·.·´`·.·*/
gulp.task('build', ['webpack:build']);
/** Selects whether to rerun as dev or prod build task*/
gulp.task('webpack:build', selectBuildMode);
/** Convienience methods to run only the webpack portion of a build*/
gulp.task('build-warning', function () {
    console.log(gutil.colors.yellow('Warning: `gulp webpack:build` does not build the ' +
        'index or some styles. Run `gulp build` to build all artifacts'));
});
gulp.task('webpack:build-prod', ['build-warning'], buildProduction);
gulp.task('webpack:build-production', ['build-warning'], buildProduction);
gulp.task('webpack:build-dev', ['build-warning'], buildDevelopment);
gulp.task('webpack:build-development', ['build-warning'], buildDevelopment);

/*·.·´`·.·•·.·´`·.·•·.·´`·.·•·.·´Lint and Testing Tasks`·.·•·.·´`·.·•·.·´`·.·•·.·´`·.·•·.·´`·.·*/
gulp.task('lint', ['lint-js', 'lint-config', 'lint-test']);
gulp.task('lint-js', function () {
    return gulp.src(['src/**/*.js', '!src/**/*.test.js'])
        // eslint() attaches the lint output to the eslint property
        // of the file object so it can be used by other modules.
        .pipe(eslint(eslintConfigJs))
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format());
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failAfterError last.
//        .pipe(eslint.failAfterError());
});
// These should be used later
// gulp.task('lint-test', function () {
//   return gulp.src(['src/**/*.test.js'])
//         .pipe(eslint(_.defaultsDeep(eslintConfigTest, eslintConfigJs)))
//         .pipe(eslint.format());
// });
// gulp.task('lint-config', function () {
//   return gulp.src(['gulpfile.js', 'webpack.config.dev.js', 'webpack.config.prod.js'])
//         .pipe(eslint(_.defaultsDeep(eslintConfigConfig, eslintConfigJs)))
//         .pipe(eslint.format());
// });

gulp.task('test', function () {
    return gulp.src(['src/**/*.test.js'], {read: false})
         .pipe(mocha({reporter: 'min'}));
});

//this task is only required when some post-build task intentionally clears the console, as our tests do
gulp.task('showBuildErrors', function () {
    console.log(fs.readFileSync('build_errors.log'));
});
