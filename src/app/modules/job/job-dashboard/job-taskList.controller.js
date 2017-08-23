;
(function () {
	"use strict";

	angular.module('app')
		.controller('JobTaskListViewController', [
			'$scope', '$stateParams', '$controller',
			'DataProvider', 'mDialog', '$timeout', 'Lang', 'Session',
			'TaskService', 'TaskAdminService', JobTaskListViewController]);


	function JobTaskListViewController($scope, $stateParams, $controller
		, DataProvider, Dialog, $timeout, Lang, Session
		, TaskService, TaskAdminService) {

		var self = this;
		var jobId = $stateParams.jobId
			, LANG = Lang.en.data
			, jobTaskListPaginatedLoader
			, jobTaskListLoaderService
			;

		angular.extend(self, $controller('ViewBaseController', {$scope: $scope}));
		angular.extend(self, $controller('ViewDataBaseController', {$scope: $scope}));

		$scope.JobTabCtrl.jobModel = DataProvider.resource.Job.get(jobId);

		$scope.onTaskItemClick = onTaskItemClick;
		var _currPageNumber = 1;
		var _defaultPageSize = 25;

		jobTaskListPaginatedLoader = TaskService.createJobTaskListLoader(jobId);

		self.jobTaskList = self.initializeViewDataBaseController('jobTaskList',
			function () {
				return jobTaskListPaginatedLoader.fn();
			}, function () {
				return $scope.JobTabCtrl.jobModel.tasks;
			});

		$scope.taskListCtrl = {
			tasks: [],
			isNextPageAvailable: jobTaskListPaginatedLoader.isNextPageAvailable,
			loadingActivity: jobTaskListPaginatedLoader.getActivityStore()
		};
		$scope.JobTabCtrl.tab_curr = 'TAB_TASK';
		$scope.fetchJobDetails().then(function () {
			getTaskMenuList();
		});


		getTaskList(_currPageNumber, _defaultPageSize);

		$scope.createThenEditTask = createThenEditTask;

		function createThenEditTask() {

			TaskAdminService.CreateTask().then(function (task) {
				/*var newTaskData = result;
				 refresh();*/
				$scope.transitionTo('root.app.task-dashboard.taskProfile', {
					jobId: task.jobEntity.id,
					taskId: task.id
				});

			});


		}

		function getTaskMenuList() {
			$scope.JobTabCtrl.optionMenuItems.TAB_TASK = [];

			var taskMenuItems = [{
				name: LANG.JOB.BUTTON.CREATE_TASK,
				action: createThenEditTask,
				args: null,
				isAllowed: $scope.JobTabCtrl.jobModel.canExecuteActionByRole('CREATE_TASK') && $scope.JobTabCtrl.jobModel.canExecuteActionByStatus('CREATE_TASK')
			}];
			angular.forEach(taskMenuItems, function (menuItem) {
				if (menuItem.isAllowed) {
					$scope.JobTabCtrl.optionMenuItems.TAB_TASK.push(menuItem);
				}
			});
		}

		function onTaskItemClick(task) {
			$scope.transitionTo('root.app.task-dashboard.taskProfile', {
				jobId: parseInt(task.jobId),
				taskId: parseInt(task.id)
			});
		}

		function getTaskList(pageNumber, pageSize) {

			$scope.isNoTasksMsgVisible = false;
			$scope.JobTabCtrl.jobModel.ejectTasks();
			$scope.jobTaskList.refresh()
				.then(function (tasks) {
					jobTaskListPaginatedLoader.incrementPageNumber();
					//$scope.taskListCtrl.tasks =
				});
		}

		function fetchMoreTasks() {
			_currPageNumber = _currPageNumber + 1;
			getTaskList(_currPageNumber, _defaultPageSize);
		}


	}


})();
