'use strict';

module.exports = function (config) {

	config.set({
		autoWatch: false,

		frameworks: ['jasmine'],

		browsers: ['PhantomJS'],

		plugins: [
			'karma-phantomjs-launcher',
      'karma-chrome-launcher',
			'karma-jasmine'
		],
		files: [
			'components/mobos'
		]
	});
};
