/**
 * Created by sudhir on 24/5/16.
 */

angular.module('app.modules')
	.directive('auditList', [
		'$rootScope', 'Lang',
		function ($rootScope, Lang) {

			var LANG = Lang.data;

			return {
				scope: {
					list: '=?',
					auditCollection: '=?',
					pageLoader: '=?'
				},
				templateUrl: 'app/modules/audit/audit-list.partial.html',
				link: function (scope, elem, attrs) {
					scope.LANG = LANG;
					scope.autoLoad = false;
					scope.auditListMeta = {};
					scope.toggleExpandAuditItemText = function (auditLogId) {
						scope.auditListMeta[auditLogId] = scope.auditListMeta[auditLogId] || {};
						scope.auditListMeta[auditLogId].isExpanded = !scope.auditListMeta[auditLogId].isExpanded;
					};

					scope.fetchPage = function () {
						_fetchPage(scope);
					};

					scope.fetchNextAuditPage = function () {
						_fetchPage(scope);
					};

					scope.$on('$destroy', function () {
						scope.pageLoader && scope.pageLoader.resetPagination();
					});

					if (scope.auditCollection && scope.pageLoader) {
						initListLoaders(scope, attrs);
					}
				}
			};

			function _fetchPage(scope) {
				try {
					scope.pageLoader.fn()
						.then(function () {
							scope.list = _.uniq(scope.list.concat(scope.auditCollection),
								function (auditItem) {
									return auditItem.auditLogId;
								});
						})
						.finally(function () {
							$rootScope.toolbarLoader.async_active = false;
						});
					$rootScope.toolbarLoader.async_active = true;
				} catch (e) {
					$rootScope.toolbarLoader.async_active = false;
				}
			}

			function initListLoaders(scope, attrs) {
				"use strict";
				scope.autoLoad = true;
				scope.list = [];
				scope.activityStore = scope.pageLoader.getActivityStore();

				_fetchPage(scope)
			}

		}
	])
;
