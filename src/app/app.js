;
(function () {
	'use strict';

	angular.module('app', [
			'app.core', 'app.constants', 'app.modules', 'app.settings',
			'app.helpers',
			'app.debug', 'app.ptr', 'app.workflow',
			'ngMaterial',
			'mobos', 'mobos.utils', 'mobos.view', 'mobos.event',
			'FilePicker', 'chatter',
			'DL',
			'AppBadge',
			'Navigator', 'InterimComponent',
			'Drawer', 'Toolbar', 'Tabs',
			'ngMessages', 'blockUI', 'ngCordova',
			'ngAnimate', 'ngTouch', 'ui.router', 'ionic.rating',
			'ng.appUiProvider.multiSelectService','lfNgMdFileInput','ngImgCrop','720kb.datepicker','braintree-angular','ui.grid', 'ui.grid.pagination',
			'chart.js'])
		.run(onAppReady);


	/**
	 * Platform ready
	 */
	function onAppReady($state, $q, $rootScope
		, DataProvider, BootService, SettingsServices
		, RouteResolver, State
		, FileSystem
		, APP_URL_SCHEMA, APP_BROADCAST) {

		var openUrlEventLogger;

		/**
		 * App run block.
		 * Executes after DOM ready or 'platform ready' for hybrid apps.
		 * Executes after document ready in other browsers.
		 */
		function runApp() {

			mobos.Viewport.$initialize();
			DataProvider.initialize();
			FileSystem.clearSavedImports();

			State.transitionTo('boot')
				.then(function () {
					BootService.waitForAppReady().then(function () {

						//	Resolve next route
						var nexState = RouteResolver.resolveFirstState();

						State.transitionTo(nexState.name, nexState.params, {
							FLAGS: {
								CLEAR_STACK: true
							}
						});
					})
				});

			if (mobos.Platform.isAndroid()) {
				mobos.on('mobos.backbutton.end.of.stack', function () {
					if (mobos.Platform.isWebView()) {
						mobos.Platform.exitApp();
					} else {
						window.location.reload();
					}
				})
			}
		}

		if (mobos.Platform.isWebView()
			&& window.cordova
			&& cordova.addStickyDocumentEventHandler) {
			openUrlEventLogger = new OpenUrlEventLogger();
			openUrlEventLogger.subscribe(APP_URL_SCHEMA.IOS_DOCUMENT_IMPORT,
				function (event, regexResult) {
					console.info(event, regexResult);
					window.resolveLocalFileSystemURL(event.url,
						function (fileEntry) {
							if (fileEntry) {
								fileEntry.getMetadata(function (fileMetaData) {
									var newFileImport = {
										fileEntry: fileEntry,
										fileMeta: fileMetaData,
										fileUri: fileEntry.nativeURL,
										fileName: fileEntry.name,
										size: fileMetaData.size,
										event: event,
										regexResult: regexResult
									};

									FileSystem.saveNewImport(newFileImport);

									$rootScope.$broadcast(APP_BROADCAST.IOS_DOCUMENT_IMPORT, newFileImport);
								});
							}
						})
				});
		}

		mobos.Platform.ready(function () {

			// Enable un-secure certificates..
			try {
				if (mobos.Platform.isWebView()) {
					cordova.plugins.certificates.trustUnsecureCerts(true);

				}
			} catch (e) {
				console.error(e);
			}
			runApp();
		})
	}

	onAppReady.$inject = ['$state', '$q', '$rootScope',
		'DataProvider', 'BootService', 'SettingsServices',
		'RouteResolver', 'State',
		'FileSystem',
		'APP_URL_SCHEMA', 'APP_BROADCAST'];

	angular.module('app.services', ['DL', 'app.constants']);


})();
