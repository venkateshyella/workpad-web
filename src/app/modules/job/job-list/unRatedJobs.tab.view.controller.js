/**
 * Created by sudhir on 28/1/16.
 */

;(function () {
	"use strict";

	function UnratedJobsTabViewController($scope, $controller, DataProvider, JobService
		, JobRating) {
		var pendingRatingJobListPaginatedLoader
			, jobIds = []
			;

		_constructor($controller, DataProvider);
		$scope.resetPRatingJobsPagination();
		return $scope.pendingRatingJobsLoader.refresh();

		function _constructor($controller, DataProvider) {
			angular.extend(self, $controller('ViewBaseController', {$scope: $scope}));
			angular.extend(self, $controller('ViewDataBaseController', {$scope: $scope}));

			while (JobService.pendingRatingJobs.length > 0) {
				JobService.pendingRatingJobs.pop();
			}

			$scope.xtras.selectedTabIndex = 2;

			/* Pending Ratings Jobs scope api. */
			pendingRatingJobListPaginatedLoader = DataProvider.PaginatedListLoaderFactory(
				JobService.pendingRatingJobs, 'fetch', JobService.pendingRatingJobs.params, 25, {
					apiParams: {
						bypassCache: true
					}
				});

			self.initializeViewDataBaseController('pendingRatingJobsLoader',
				function () {
					return pendingRatingJobListPaginatedLoader.fn()
						.then(function (res) {
							getPendingRatingJobs();
							return res;
						});
				});
			$scope.resetPRatingJobsPagination = function () {
				pendingRatingJobListPaginatedLoader.resetPagination()
			};
			$scope.areMorePRatingsJobsAvailable = function () {
				return pendingRatingJobListPaginatedLoader.isNextPageAvailable();
			};
			$scope.jobEditRatingAction = jobEditRatingAction;
		}

		function jobEditRatingAction($event, job) {
			JobRating.runEditRatingWorkflow(job, {
					targetEvent: $event
				})
				.then(function (res) {
					return $scope.pendingRatingJobsLoader.refresh()
						.then(function() {
							getPendingRatingJobs();
						});
				})
				.catch(function (err) {
				})
			;
		}

		function getPendingRatingJobs() {
			jobIds = [];
			jobIds = _.uniq(jobIds.concat(_.pluck(JobService.pendingRatingJobs, 'id')));
			$scope.pendingRatingJobsList = DataProvider.resource.Job.getAll(jobIds);
		}
	}

	UnratedJobsTabViewController.$inject = ['$scope', '$controller'
		, 'DataProvider', 'JobService'
		, 'JobRating'];

	angular.module('app')
		.controller('UnratedJobsTabViewController', UnratedJobsTabViewController)
	;

})();