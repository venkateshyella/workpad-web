/**
 * Created by sudhir on 18/5/16.
 */

angular.module('app')
	.controller('OrgAuditViewController', [
		'$scope', '$stateParams',
		'DataProvider', 'OrganisationService',
		'Lang',
		function ($scope, $stateParams
			, DataProvider, OrganisationService
			, Lang) {
			"use strict";
			var org = null
				, orgAuditCollection = []
				, orgAuditCollectionLoader
				;

			$scope.LANG = Lang.data;
			$scope.xtras.selectedTabIndex = 9;
			$scope.fetchOrgAuditPage = fetchOrgAuditPage;
			$scope.fetchOrgAuditPage = fetchOrgAuditPage;
			$scope.resetOrgAuditPagination = resetOrgAuditPagination;
			$scope.toggleExpandAuditItemText = toggleExpandAuditItemText;
			$scope.orgAuditList = [];
			$scope.orgAuditListMeta = {};
			$scope.isNextAuditPageAvailable = function () {
				return orgAuditCollectionLoader
					&& orgAuditCollectionLoader.isNextPageAvailable();
			};

			$scope.getOrgDetails()
				.then(function (orgModel) {
					initOrgAuditView(orgModel);
					resetOrgAuditPagination();
					fetchOrgAuditPage();
				});

			function toggleExpandAuditItemText(id) {
				$scope.orgAuditListMeta[id] = $scope.orgAuditListMeta[id] || {};
				$scope.orgAuditListMeta[id].isExpanded = !$scope.orgAuditListMeta[id].isExpanded
			}

			function fetchOrgAuditPage() {
				orgAuditCollectionLoader.fn()
					.then(function () {
						$scope.orgAuditList = _.uniq($scope.orgAuditList.concat(orgAuditCollection),
							function (auditItem) {
								return auditItem.auditLogId;
							});
						// orgAuditCollectionLoader.incrementPageNumber();
					});
			}

			function resetOrgAuditPagination() {
				orgAuditCollectionLoader.resetPagination();
			}

			function initOrgAuditView(orgModel) {
				org = orgModel;
				orgAuditCollectionLoader = OrganisationService.createAuditListCollectionLoader(
					org.id, orgAuditCollection);
				$scope.orgAuditCollectionLoader_activityStore = orgAuditCollectionLoader.getActivityStore();
			}

		}
	])
;