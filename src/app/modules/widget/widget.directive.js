/**
 * Created by sudhir on 3/11/15.
 */

;(function() {
	"use strict";

	/**
	 * Render small UI containers,
	 * each having its own controller and template.
	 */
	angular.module('app.modules')
	;

	function WidgetDirective() {

		return {
			restrict: "E",
			scope: {},
			link: {
				post: postLink
			},
			controller: ['$scope', WidgetController]
		};

		function postLink() {}

		function WidgetController($scope) {

		}
	}

})();
