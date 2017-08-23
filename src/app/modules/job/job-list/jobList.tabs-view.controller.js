;
(function () {
	"use strict";

	angular.module('app')
		.controller('JobTabsListViewController', ['$scope', '$controller', '$stateParams', 'blockUI', 'DataProvider', '$timeout', '$state', 'JobRating', 'JOB', 'TASK', JobListViewController]);

	function JobListViewController($scope, $controller, $stateParams, blockUI, DataProvider, $timeout, $state, JobRating, JOB, TASK) {

		var _currPageNumber = 1
			, _defaultPageSize = 25
			, self = this
			, openJobListPaginatedLoader
			, pendingTimesheetJobListPaginatedLoader
			, pendingRatingJobListPaginatedLoader
			, defaultTab = $stateParams.tab || 'TAB_JOBS_OPEN'
			;

		constructor(this, $scope, $controller);

		function constructor(self, $scope, $controller) {
			$scope.viewTabs = {
				TAB_JOBS_OPEN: {
					allowedActions: []
				},
				TAB_JOBS_PENDING_TIMESHEET: {
					allowedActions: []
				},
				TAB_JOBS_PENDING_RATING: {
					allowedActions: []
				}
			};

			$scope.optionMenuItems= [];
			
			self.tabs = ['TAB_JOBS_OPEN', 'TAB_JOBS_PENDING_TIMESHEET', 'TAB_JOBS_PENDING_RATING'];

			angular.extend($scope, {
				ROLES: JOB.ROLES,
				ROLE_NAMES: JOB.ROLE_NAMES,
				TASK_ROLE_NAMES: TASK.ROLE_NAMES,
				openJobsList: [],
				pendingTimesheetJobsList: [],
				pendingRatingJobsList: [],
				viewTaskFlagMeta: {},
				xtras: {
					selectedTabIndex: 0
				},
				tab_curr: defaultTab
			}, {
				fetchMoreJobs: fetchMoreJobs,
				refresh: refresh,
				jobItemClickAction: jobItemClickAction,
				taskItemClickAction: taskItemClickAction,
				toggleTaskList: toggleTaskList,
				onTabSelect: onTabSelect
			});
			angular.extend(self, $controller('ViewBaseController', {$scope: $scope}));
			angular.extend(self, $controller('ViewDataBaseController', {$scope: $scope}));

			/* Open Jobs scope api. */
			openJobListPaginatedLoader = DataProvider.PaginatedListLoaderFactory(
				DataProvider.resource.Job, 'findAll', {}, 25, {
					apiParams: {
						bypassCache: true
					}
				});

			self.initializeViewDataBaseController('openJobsLoader',
				function () {
					return openJobListPaginatedLoader.fn()
						.then(function (res) {
							$scope.openJobsList = DataProvider.resource.Job.filter({
								limit: openJobListPaginatedLoader.itemCounter
							});

							return res;
						});
				});
			$scope.resetOpenJobsPagination = function () {
				openJobListPaginatedLoader.resetPagination()
			};
			$scope.areMoreOpenJobsAvailable = function () {
				return openJobListPaginatedLoader.isNextPageAvailable();
			};

			/* Pending Ratings Jobs scope api. */
			pendingRatingJobListPaginatedLoader = DataProvider.PaginatedListLoaderFactory(
				DataProvider.resource.Job, 'findAll', {}, 25, {
					apiParams: {
						bypassCache: true
					}
				});

			self.initializeViewDataBaseController('pendingRatingJobsLoader',
				function () {
					return pendingRatingJobListPaginatedLoader.fn()
						.then(function (res) {
							$scope.pendingRatingJobsList = DataProvider.resource.Job.filter({
								limit: pendingRatingJobListPaginatedLoader.itemCounter
							});
							return res;
						});
				});
			$scope.resetPRatingJobsPagination = function () {
				openJobListPaginatedLoader.resetPagination()
			};
			$scope.areMorePRatingsJobsAvailable = function () {
				return pendingRatingJobListPaginatedLoader.isNextPageAvailable();
			};

		}
		
		function onTabSelect(tabName) {
			switch (tabName) {
				case "TAB_JOBS_OPEN":
					$scope.transitionTo('root.app.job-list.openJobList', {}, {REPLACE_STATE: true});
					_init_JobsListTab();
					break;
				case "TAB_JOBS_PENDING_TIMESHEET":
					$scope.transitionTo('root.app.job-list.pendingTimesheetJobList', {}, {REPLACE_STATE: true});
					_init_JobsTimesheetTab();
					break;
				case "TAB_JOBS_PENDING_RATING":
					$scope.transitionTo('root.app.job-list.pendingRatingJobList', {}, {REPLACE_STATE: true});
					_init_JobsReviewTab();
					break;
			}
			$timeout(function () {
			});
		}

		function _init_JobsListTab() {
			$scope.tab_curr = 'TAB_JOBS_OPEN';
			//$scope.resetOpenJobsPagination();
			//return $scope.openJobsLoader.refresh();
		}

		function _init_JobsTimesheetTab() {
			$scope.tab_curr = 'TAB_JOBS_PENDING_TIMESHEET';
		}

		function _init_JobsReviewTab() {
			$scope.tab_curr = 'TAB_JOBS_PENDING_RATING';
			//$scope.resetPRatingJobsPagination();
			//return $scope.pendingRatingJobsLoader.refresh()
		}

		function fetchMoreJobs() {
			_currPageNumber = _currPageNumber + 1;
			getJobsList(_currPageNumber, _defaultPageSize);
		}

		/**
		 * Primary click action for the job liting item.
		 * @param job
		 */
		function jobItemClickAction($event, job) {
			if (job && job.id) {
				$scope.transitionTo('root.app.job-view.jobProfile', {
					jobId: job.id
				}, {REPLACE_STATE: false});
			}
		}

		function taskItemClickAction($event, task) {
			if (task && task.id) {
				$scope.transitionTo('root.app.task-dashboard.taskProfile', {
					jobId: parseInt(task.jobId),
					taskId: parseInt(task.id)
				}, {REPLACE_STATE: false});
			}
		}

		function toggleTaskList(job) {
			$scope.viewTaskFlagMeta[job.id] = !$scope.viewTaskFlagMeta[job.id];

		}

		function refresh() {
			// $scope.jobList = [];
			$scope.isNextPageAvailable = false;
			_currPageNumber = 1;
			getJobsList(_currPageNumber, _defaultPageSize);
		}

	}

})();
