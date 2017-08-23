/**
 * Created by sudhir on 22/10/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.controller('TaskFormsViewController', [
			'$scope', '$controller', '$stateParams', 'DataProvider',
			TaskFormsViewController
		])
	;

	function TaskFormsViewController($scope, $controller, $stateParams
		, DataProvider, Lang) {

		var self = this
			, taskId = $stateParams.taskId
			, taskModel
			;

		taskModel = DataProvider.resource.Task.get(taskId);

		angular.extend(self, $controller('ViewDataBaseController', {
			$scope: $scope
		}));
		self.paginatedJobFormsLoader
			= DataProvider.PaginatedListLoaderFactory(taskModel, 'loadForms', {}, 100);
		self.jobFormsLoader
			= self.initializeViewDataBaseController('taskForms', self.paginatedJobFormsLoader.fn,
			findTaskForms);

		$scope.taskModel = taskModel;
		$scope.refresh = refresh;

		refresh();

		function refresh() {
			self.paginatedJobFormsLoader.resetPagination();
			$scope.taskForms.refresh();
		}

		function findTaskForms() {
			return taskModel.forms;
		}

	}

})();