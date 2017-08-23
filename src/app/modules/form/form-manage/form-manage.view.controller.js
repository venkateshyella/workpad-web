/**
 * Created by sudhir on 16/10/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.controller('FormManagerViewController', [
			'$scope', '$controller', '$stateParams', 'mDialog',
			'DataProvider',
			'Lang',
			FormManagerViewController
		])
	;

	function FormManagerViewController($scope, $controller, $stateParams
		, Dialog, DataProvider
		, Lang) {

		var self = this
			, LANG = Lang.en.data
			, contextModel
			;

		$scope.flags = {
			ui: {}
		};
		$scope.contextModel = contextModel;
		$scope.workFlow = {
			refresh: refresh,
			loadNextPage: loadNextPage,
			addForm: addForm,
			removeForm: removeForm,
			resetFormTrigger: resetFormTrigger,
		};

		_init();

		function _init() {
			switch ($stateParams.context) {
				case 'job':
					_initJobFormsManger();
					refresh();
					break;
				case 'task':
					_initTaskFormManager();
					break;
				default:
					console.log('invalid state')
			}
		}

		function refresh() {
			self.jobFormsPaginatedLoader.resetPagination();
			return $scope.jobFormList.refresh();
		}

		function loadNextPage() {
			return $scope.jobFormList.refresh();
		}

		function _initJobFormsManger() {
			$scope.contextModel = contextModel = DataProvider.resource.Job.get($stateParams.jobId);
			angular.extend(self, $controller('ViewDataBaseController', {$scope: $scope}));
			self.jobFormsLoader = self.initializeViewDataBaseController('jobFormList',
				fetchJobForms,
				findJobForms);

			self.jobFormsPaginatedLoader = DataProvider.PaginatedListLoaderFactory(contextModel, 'loadForms', {});
		}

		function fetchJobForms() {
			return self.jobFormsPaginatedLoader.fn()
				.then(function (res) {
					console.log(res);
					return res;
				})
				.catch(function (err) {
					console.log(err);
				})
			;
		}

		function findJobForms() {
			return contextModel.forms;
		}

		function _initTaskFormManager() {
			contextModel = DataProvider.resource.Task.get($stateParams.taskId);
		}

		function addForm(templateId, formDetails) {
		}

		function removeForm(formId) {
		}

		function resetFormTrigger(formId, triggerName) {
		}

	}

})();