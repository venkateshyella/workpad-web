/**
 * Created by sudhir on 9/5/16.
 */

;(function () {
	"use strict";

	//@formatter:off
	var pathTemplate =
		'<span>' +
			'<span ng-repeat="item in path | limitTo: (depth || 10)"' +
				'ng-class="{\'push-left pr-sm\':!$first}">' +
				'<i ng-class="{\'icon-group-work\':item.type==\'GROUP\', \'icon-domain\':item.type==\'ORG\'}" ' +
					'class="icon" style="margin-right: 3px"></i>'+
				'<small ng-bind="item.name" ' +
					'class="text-ellipsis"></small>' +
			'</span>' +
		'</span>'
		;
	//@formatter:on

	angular.module('app.core')
		.directive('contextPath', ['Lang',
			function (Lang) {
				var LANG = Lang.data;
				return {
					scope: {
						depth: '=',
						path: '='
					},
					replace: true,
					template: pathTemplate,
					link: function (scope, elem, attrs) {
					}
				}
			}
		])
	;
})();