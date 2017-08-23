/**
 * Created by sandeep on 15/09/16.
 */

;
(function () {
	"use strict";

	angular.module("app")
		.directive('autoInputFocus', function ($timeout) {
	        function link($scope, $element, $attrs) {
	            var dom = $element[0];
	            if ($attrs.focusIf) {
	                $scope.$watch($attrs.focusIf, focus);
	            } else {
	                focus(true);
	            }
	            function focus(condition) {
	                if (condition) {
	                    $timeout(function() {
	                        dom.focus();
	                    }, $scope.$eval($attrs.focusDelay) || 0);
	                }
	            }
	        }
	        return {
	            restrict: 'A',
	            link: link
	        };
	    
		})
})();