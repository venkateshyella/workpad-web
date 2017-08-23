'use strict';

var gulp = require('gulp');

var $ = require('gulp-load-plugins')();

var wiredep = require('wiredep');

var paths = gulp.paths;

function runTests(singleRun, done) {
	var bowerDeps = wiredep({
		directory: 'bower_components',
		exclude: ['bootstrap-sass-official'],
		dependencies: true,
		devDependencies: true
	});

	var testFiles = bowerDeps.js.concat([
		// mobos tests
		paths.src + '/components/mobos/core/core.js',
		paths.src + '/components/mobos/core/utils/*.js',
		paths.src + '/components/mobos/core/event/*.js',

    // Interim element
		paths.src + '/components/mobos/services/interimElement/interimElement.js',
		paths.src + '/components/mobos/services/interimElement/interimComponent.js',

    // Device services
    paths.src + '/components/mobos/services/device/*.js',

    // Navigation service
    paths.src + '/components/mobos/services/navigation/navigation.js',
    paths.src + '/components/mobos/services/navigation/navigation.directive.js',

    // mobos.view
    paths.src + '/components/mobos/component/view/view.js',
    paths.src + '/components/mobos/component/view/**/*.js',

    // mobos.utils
    paths.src + '/components/mobos-utils/*.js',

    paths.src + '/components/mobos-utils/services/**/*.js',


    // mobosApp tests

    paths.src + '/app/app.js'


	]);

	gulp.src(testFiles)
		.pipe($.karma({
			configFile: 'karma.conf.js',
			action: (singleRun) ? 'run' : 'watch'
		}))
		.on('error', function (err) {
			// Make sure failed tests cause gulp to exit non-zero
			throw err;
		});
}

gulp.task('test', function (done) {
	runTests(true /* singleRun */, done)
});
gulp.task('test:auto', function (done) {
	runTests(false /* singleRun */, done)
});
