/**
 * Created by sudhir on 22/10/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.controller('JobFormsViewController', [
			'$scope', '$controller', '$stateParams', 'DataProvider',
			JobFormsViewController
		])
	;

	function JobFormsViewController($scope, $controller, $stateParams
		, DataProvider, Lang) {

		var self = this
			, jobId = $stateParams.jobId
			, jobModel
			;

		jobModel = DataProvider.resource.Job.get(jobId);

		angular.extend(self, $controller('ViewDataBaseController', {
			$scope: $scope
		}));
		self.paginatedJobFormsLoader
			= DataProvider.PaginatedListLoaderFactory(jobModel, 'loadForms', {}, 100);
		self.jobFormsLoader
			= self.initializeViewDataBaseController('jobForms', self.paginatedJobFormsLoader.fn, findJobForms);

		$scope.jobModel = jobModel;
		$scope.refresh = refresh;

		refresh();

		function refresh() {
			self.paginatedJobFormsLoader.resetPagination();
			$scope.jobForms.refresh();
		}

		function findJobForms() {
			return jobModel.forms;
		}

	}

})();