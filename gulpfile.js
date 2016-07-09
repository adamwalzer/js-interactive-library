require('babel-core/register');//for mocha to use es6
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
webpackDevConfig.output.filename = 'skoash.' + appPackage.version + '.js';
webpackProdConfig.output.filename = 'skoash.' + appPackage.version + '.js';
var childProcess = require('child_process');
// var exec = childProcess.exec;
var spawn = childProcess.spawn;
var eslint = require('gulp-eslint');
var fs = require('fs');
var eslintConfigJs = JSON.parse(fs.readFileSync('./.eslintrc'));
var env = require('gulp-env');
// var _ = require('lodash');
// var inject = require('gulp-inject');
// var ExtractTextPlugin = require('extract-text-webpack-plugin');
// var mergeStream = require('merge-stream');
// var sri = require('gulp-sri');
var mocha = require('gulp-mocha');

//mode defaults to development and is selected with the following precedences:
// --development flag
// --production flag
// APP_ENV environment variable
// NODE_ENV environment variable
var mode = 'development';
if (args.development || args.prod) {
  mode = 'development';
} else if (args.prod || args.production) {
  mode = 'production';
} else if (process.env.APP_ENV) {
  mode = process.env.APP_ENV;
} else if (process.env.NODE_ENV) {
  mode = process.env.NODE_ENV;
}

/*
___  ______  ______  ______  ______  ______  ______  ______  ______  ______  ______  ______  ______  ___
 __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__
(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)
                                    #1 Build Functions
___  ______  ______  ______  ______  ______  ______  ______  ______  ______  ______  ______  ______  ___
 __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__  __)(__
(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)(______)
*/

/**
 * Higher order function. Starts an arbitrary shell command
 * note that this is not a gulp best practice, and should be
 * used sparingly and only with justification.
 * @param {string} command - command to run
 * @param {string[]} [flags = []] - any flags that need to be passed to command
 */
var executeAsProcess = function (command, flags) {
  return function () {
    var start = spawn(command, flags);
    start.stdout.on('data', function (data) {
      console.log('stdout: ' + data);
    });

    start.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
    });
  };
};

var buildDevelopment = function () {
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

var buildProduction = function () {
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

var selectBuildMode = function () {

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
  gulp.watch('src/**/*.js', ['build']);
});

/*·.·´`·.·•·.·´`·.·•·.·´`·.·•·.·´JS Build Tasks`·.·•·.·´`·.·•·.·´`·.·•·.·´`·.·•·.·´`·.·*/
gulp.task('build', ['webpack:build']);
/** Selects whether to rerun as dev or prod build task*/
gulp.task('webpack:build', selectBuildMode);
/** Convienience methods to run only the webpack portion of a build*/
gulp.task('build-warning', function () {
  console.log(gutil.colors.yellow('Warning: `gulp webpack:build` does not build the index or some styles. Run `gulp build` to build all artifacts'));
});
gulp.task('webpack:build-prod', ['build-warning'], buildProduction);
gulp.task('webpack:build-production', ['build-warning'], buildProduction);
gulp.task('webpack:build-dev', ['build-warning'], buildDevelopment);
gulp.task('webpack:build-development', ['build-warning'], buildDevelopment);
/** Convienience Build Aliases */
// eAP here just lets us restart gulp with appropriate flags
// so that build is the single source of truth. Style and index
// are dependent, so we need a way to call different commands
// while still going through the single webpack:build dependency.
// as such, this is how we need to alias build commands.
gulp.task('build-dev', executeAsProcess('gulp build', ['build', '--development']));
gulp.task('build-development', executeAsProcess('gulp build', ['build', '--development']));
gulp.task('build-prod', executeAsProcess('gulp build', ['build', '--production']));
gulp.task('build-production', executeAsProcess('gulp build', ['build', '--production']));

/*·.·´`·.·•·.·´`·.·•·.·´`·.·•·.·´Resource and Static Asset Tasks`·.·•·.·´`·.·•·.·´`·.·•·.·´`·.·•·.·´`·.·*/

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
