/**
 * Created by sudhir on 28/1/16.
 */
;(function () {
	"use strict";
	function OpenJobsTabViewController($scope, $controller, $timeout
		, DataProvider, JobService, URL, AuditService, blockUI, Dialog) {
		var openJobListPaginatedLoader
			, jobsAuditPageLoader
			, jobIds = []
			, jobAuditCollection = []
			, jobAuditList = []
			;

		$scope.state = {
			showAudit: false
		};

		_constructor($controller, DataProvider);

		$scope.resetOpenJobsPagination();

		$scope.refreshOpenJobsAudit = function () {
			fetchJobsAudit();
		};

		function getOpenJobsMenuList(){
			$scope.optionMenuItems.TAB_JOBS_OPEN = [];

			var openJobMenuItems = [{
				name: "Audits",
				action: auditClicked,
				args: null,
				isAllowed:true
			}];
			angular.forEach(openJobMenuItems, function (menuItem) {
				if (menuItem.isAllowed) {
					$scope.optionMenuItems.TAB_JOBS_OPEN.push(menuItem);
				}
			});
		}
		
		getOpenJobsMenuList();

		$scope.openJobsLoader.refresh();
		// $scope.openJobsAuditLoader.refresh();

		function _constructor($controller) {

			while (JobService.openJobs.length > 0) {
				JobService.openJobs.pop();
			}

			$scope.toggleAudit = function (enable) {
				"use strict";
				$timeout(function () {
					$scope.state.showAudit = !!enable;
					if ($scope.state.showAudit) {
						resetJobAuditList();
						fetchJobsAudit()
					}
					else {
						$scope.openJobsLoader.refresh();
					}
				}, 0);
			};

			$scope.fetchNextAuditPage = function () {
				fetchJobsAudit();
			};

			$scope.inNextJobsAuditPageAvailable = inNextJobsAuditPageAvailable;

			$scope.xtras.selectedTabIndex = 0;


			angular.extend(self, $controller('ViewBaseController', {$scope: $scope}));
			angular.extend(self, $controller('ViewDataBaseController', {$scope: $scope}));

			/* Open Jobs scope api. */
			openJobListPaginatedLoader = DataProvider.PaginatedListLoaderFactory(
				JobService.openJobs, 'fetch', JobService.openJobs.params, 25, {
					apiParams: {
						bypassCache: true
					}
				});

			self.initializeViewDataBaseController('openJobsLoader',
				function () {
					return openJobListPaginatedLoader.fn()
						.then(function (res) {
							jobIds = _.uniq(jobIds.concat(_.pluck(JobService.openJobs, 'id')));
							$scope.openJobsList = DataProvider.resource.Job.getAll(jobIds);

							openJobListPaginatedLoader.resetItemCount($scope.openJobsList.length);
							return res;
						});
				},
				function () {
					$scope.openJobsList = JobService.openJobs;
					return JobService.openJobs.length > 0 ? JobService.openJobs : null;
				});

			jobsAuditPageLoader = JobService.createOpenJobsAuditPageLoader(jobAuditCollection);
			self.initializeViewDataBaseController('openJobsAuditLoader',
				function () {
					return jobsAuditPageLoader.fn()
						.then(function (auditList) {
							jobAuditList = _.uniq(jobAuditList.concat(auditList), 'auditLogId');
							$scope.jobAuditList = jobAuditList;

							console.log(jobAuditList);
							jobsAuditPageLoader.resetItemCount(jobAuditList.length);
							return jobAuditList;
						})
						.catch(function (err) {
							console.log(err);
						});
				},
				function () {
					return null;
				});

			$scope.resetOpenJobsPagination = function () {
				openJobListPaginatedLoader.resetPagination()
			};
			$scope.areMoreOpenJobsAvailable = function () {
				return openJobListPaginatedLoader.isNextPageAvailable();
			};

			$scope.auditActivityStore = jobsAuditPageLoader.getActivityStore();

		}

		function resetJobAuditList() {
			$scope.jobAuditList = [];
			jobsAuditPageLoader.resetPagination();
		}

		function inNextJobsAuditPageAvailable() {
			$scope.auditActivityStore && $scope.auditActivityStore.isNextPageAvailable();
		}

		function fetchJobsAudit() {
			$scope.openJobsAuditLoader.refresh()
				.then(function (res) {
				})
		}
		
		function auditClicked() {
			var params = {};
//			params.catId = $stateParams.jobId;
//			params.catType = CATEGORY_TYPE.JOB;

			blockUI.start("Fetching Audit data");
			AuditService.checkAuditList(URL.OPEN_JOB_AUDIT_LIST,params).then(function (res) {
				if (res.results.length > 0) {
					var title = "";
					blockUI.stop();

					AuditService.showAudit(URL.OPEN_JOB_AUDIT_LIST,params,title, res).then(function (res) {

					}).catch(function (err) {
						Dialog.alert({
							content: err.message,
							ok: "Ok"
						});
					});
				} else{
					blockUI.stop("No Audits available", {
						status: 'isSuccess',
						action: LANG.BUTTON.OK
					})
				}
			})
			.catch(function (err) {
				Dialog.alert({
					content: err.message,
					ok: "Ok"
				});
			}).finally(function () {
				blockUI.stop();
			});
		}
	}

	OpenJobsTabViewController.$inject = ['$scope', '$controller', '$timeout', 'DataProvider', 'JobService', 'URL', 'AuditService', 'blockUI', 'mDialog'];

	angular.module('app')
		.controller('OpenJobsTabViewController', OpenJobsTabViewController)
	;
})();