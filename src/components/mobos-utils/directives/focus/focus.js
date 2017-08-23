/**
 * Created by sudhir on 30/11/15.
 */


;
(function () {
	"use strict";

	angular.module("mobos.utils")
		.directive('triggerFocus', function ($timeout) {
			return function (scope, element, attrs) {
				console.log("trigger-focus");
				scope.$watch(attrs.triggerFocus,
					function (newValue) {
						//console.log("trigger-focus");
						$timeout(function () {
							newValue && element[0].focus();
							if (mobos.Platform.isWebView() && mobos.Platform.isIOS()) {
								if (cordova && cordova.plugins && cordova.plugins.Keyboard) {
									cordova.plugins.Keyboard.show();
								}
							}
						}, 100);
					}, true);
			};
		})
		.directive('focusMe', function () {
			return {
				restrict: 'A',
				scope: {
					focusMe: '='
				},
				link: function (scope, elt) {
					scope.$watch('focusMe', function (val) {
						if (val) {
							elt[0].focus();
						}
					});
				}
			};
		});
})();