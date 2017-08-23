/**
 * Created by sudhir on 18/5/16.
 */

angular.module('app')
	.controller('GroupAuditViewController', [
		'$scope', '$stateParams',
		'DataProvider', 'GroupService',
		'Lang',
		function ($scope, $stateParams
			, DataProvider, GroupService
			, Lang) {
			"use strict";
			var group = null
				, groupAuditCollection = []
				, groupAuditCollectionLoader
				;

			$scope.LANG = Lang.data;
			$scope.xtras.selectedTabIndex = 8;
			$scope.fetchGroupAuditPage = fetchGroupAuditPage;
			$scope.fetchGroupAuditPage = fetchGroupAuditPage;
			$scope.resetGroupAuditPagination = resetGroupAuditPagination;
			$scope.toggleExpandAuditItemText = toggleExpandAuditItemText;
			$scope.jobAuditList = [];
			$scope.jobAuditListMeta = {};
			$scope.isNextAuditPageAvailable = function () {
				return groupAuditCollectionLoader
					&& groupAuditCollectionLoader.isNextPageAvailable();
			};

			$scope.getGroupModelAndOrgModel()
				.then(function (groupModel) {
					initGroupAuditView(groupModel);
					resetGroupAuditPagination();
					fetchGroupAuditPage();
				});

			function toggleExpandAuditItemText(id) {
				$scope.jobAuditListMeta[id] = $scope.jobAuditListMeta[id] || {};
				$scope.jobAuditListMeta[id].isExpanded = !$scope.jobAuditListMeta[id].isExpanded
			}

			function fetchGroupAuditPage() {
				groupAuditCollectionLoader.fn()
					.then(function () {
						$scope.jobAuditList = _.uniq($scope.jobAuditList.concat(groupAuditCollection),
							function (auditItem) {
								return auditItem.auditLogId;
							});
						// groupAuditCollectionLoader.incrementPageNumber();
					});
			}

			function resetGroupAuditPagination() {
				groupAuditCollectionLoader.resetPagination();
			}

			function initGroupAuditView(groupModel) {
				group = groupModel;
				groupAuditCollectionLoader = GroupService.createAuditListCollectionLoader(
					group.id, groupAuditCollection);
				$scope.groupAuditCollectionLoader_activityStore = groupAuditCollectionLoader.getActivityStore();
			}

		}
	])
;