/**
 * Created by rihdus on 1/5/15.
 */

;
(function () {

	/*
	var IPAD_ORIENTATIONS = [0, 90, -90];
	var IOS_ORIENTATIONS = [0];

	mobos.Platform.ready(function () {
		"use strict";
		var _platform = mobos.Platform.device()
			&& mobos.Platform.device().platform
			&& mobos.Platform.device().platform.toLocaleLowerCase();
    */

		/**
		 * Platform allowed orientations check.
		 * ref: "https://cordova.apache.org/docs/en/5.1.1/config_ref/#link-4"
		 *
		 * @param {Number} degree
		 *     UIInterfaceOrientationPortrait: 0,
		 *     UIInterfaceOrientationLandscapeRight: 90,
		 *     UIInterfaceOrientationLandscapeLeft: -90,
		 *     UIInterfaceOrientationPortraitUpsideDown: 180
		 *
		 * @returns {Boolean} Indicating if rotation should be allowed.
		 */
/*	window.shouldRotateToOrientation = function shouldRotateToOrientation(degree) {
			switch (_platform) {
				case 'android':
					return true;
					break;

				case 'ios':
					if (mobos.Platform.isIPad()) {
						return IPAD_ORIENTATIONS.indexOf(degree) > -1
					} else {
						return IOS_ORIENTATIONS.indexOf(degree) > -1
					}
					break;
			}
			return false;
		}
	});
*/
	angular.module('app')
		.config(AppMasterConfig);

	function AppMasterConfig(LangProvider) {
		LangProvider.defineNewLanguage('en', 'assets/lang/en.json', {
				"BOOT_PROCESS": {
					"LANG_LOADING_IN_PROGRESS": "Loading Language files.",
					"PING_IN_PROGRESS": "Connecting to application servers."
				}
			})
			.setDefaultLang('en')
		;
	}
	
	function httpAsyncConf($httpProvider) {
		  $httpProvider.useApplyAsync(true);
		}
	
	angular.module('app').config(httpAsyncConf);
	
//	angular.module('app').config(['$provide', function($provide) {
        /**
          * Angular Material dynamically generates Style tags
          * based on themes and palletes; for each ng-app.
          * Let's disable generation and <style> DOM injections. 
          */
//         $provide.constant('$MD_THEME_CSS', '/**/');
//    }]);

	
	/*
	 * configuration for adding X-Api-Key in request headers for http calls
	 */
	angular.module('app').config(['$httpProvider','SecurifyProvider','X_API_KEY', function ($httpProvider, SecurifyProvider,X_API_KEY) {
		var encApiKey = SecurifyProvider.$get().encrypt(X_API_KEY, 'kef');
	    $httpProvider.defaults.headers.common = { 
	       'X-Api-Key': encApiKey
	      }; 
	}]);

	AppMasterConfig.$inject = ['LangProvider'];
	httpAsyncConf.$inject = ['$httpProvider'];

})();
