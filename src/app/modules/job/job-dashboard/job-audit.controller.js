/**
 * Created by sudhir on 18/5/16.
 */

angular.module('app')
	.controller('JobAuditViewController', [
		'$scope', '$stateParams', 'jobModel',
		'DataProvider', 'JobService',
		'Lang',
		function ($scope, $stateParams, jobModel
			, DataProvider, JobService
			, Lang) {
			"use strict";
			var job = jobModel
				, jobAuditCollection = []
				, jobAuditCollectionLoader
				;

			$scope.xtras.title = jobModel && jobModel.title;
			$scope.xtras.subTitle = jobModel && jobModel.getFullPath();

			$scope.LANG = Lang.data;
			$scope.xtras.selectedTabIndex = 7;
			$scope.fetchJobAuditPage = fetchJobAuditPage;
			$scope.resetJobAuditPagination = resetJobAuditPagination;
			$scope.toggleExpandAuditItemText = toggleExpandAuditItemText;
			$scope.jobAuditList = [];
			$scope.jobAuditListMeta = {};
			$scope.isNextAuditPageAvailable = function () {
				return jobAuditCollectionLoader
					&& jobAuditCollectionLoader.isNextPageAvailable();
			};

			initJobAuditView();
			fetchJobAuditPage();

			function toggleExpandAuditItemText(id) {
				$scope.jobAuditListMeta[id] = $scope.jobAuditListMeta[id] || {};
				$scope.jobAuditListMeta[id].isExpanded = !$scope.jobAuditListMeta[id].isExpanded
			}

			function fetchJobAuditPage() {
				jobAuditCollectionLoader.fn()
					.then(function () {
						$scope.jobAuditList = _.uniq($scope.jobAuditList.concat(jobAuditCollection),
							function (auditItem) {
								return auditItem.auditLogId;
							});
					});
			}

			function resetJobAuditPagination() {
				jobAuditCollectionLoader.resetPagination();
			}

			function initJobAuditView() {
				jobAuditCollectionLoader = JobService.createAuditListCollectionLoader(job.id, jobAuditCollection);
				$scope.jobAuditCollectionLoader_activityStore = jobAuditCollectionLoader.getActivityStore();
			}

		}
	])
;