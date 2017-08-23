;
(function () {
	"use strict";

	angular.module('app')
		.controller('TaskInfoViewController', ['$scope', '$stateParams', 'blockUI',
			'DataProvider', 'mDialog', '$timeout', 'TaskWorkflowRunner', 'Lang',
			'TaskAdminService', 'TasLifeCycleService', 'Session', '$mdToast', 'CATEGORY_TYPE', 'AuditService','URL',TaskInfoViewController
		]);


	function TaskInfoViewController($scope, $stateParams
		, blockUI, DataProvider, Dialog, $timeout
		, TaskWorkflowRunner, Lang
		, TaskAdminService, TasLifeCycleService, Session, $mdToast, CATEGORY_TYPE, AuditService, URL) {

		var LANG = Lang.data
			, taskId = $stateParams.taskId
			, fn_taskToggleBlock
			;

		$scope.xtras.selectedTabIndex = 0;

		refresh();

		function refresh() {
			$scope.fetchTaskModelAndJobModel().then(function () {
				initInfoView();
			});
		}

		function initInfoView() {
			getInfoTabMenuItems();
			fn_taskToggleBlock = TaskAdminService.createTaskToggleServiceRunner($scope.taskTabCtrl.taskModel);
		}

		function getInfoTabMenuItems() {

			$scope.taskTabCtrl.optionMenuItems.TAB_INFO = [];
			var infoMenuItems = [
				{
					name: LANG.BUTTON.EDIT,
					action: taskEditClicked,
					isAllowed: (
						$scope.taskTabCtrl.taskModel.canExecuteActionByRole('EDIT')
						&& $scope.taskTabCtrl.taskModel.canExecuteActionByStatus('EDIT')
					)
				},
				{
					name: LANG.TASK.LABEL.ACTION_TASK_BLOCK,
					action: function () {
						onTaskToggleBlock(true)
					},
					isAllowed: (
						$scope.taskTabCtrl.taskModel.canExecuteActionByRole('TASK_BLOCK')
						&& $scope.taskTabCtrl.taskModel.canExecuteActionByStatus('TASK_BLOCK')
						&& !$scope.taskTabCtrl.taskModel.$isBlocked()
					)
				},
				{
					name: LANG.TASK.LABEL.ACTION_TASK_UNBLOCK,
					action: function () {
						onTaskToggleBlock(false)
					},
					isAllowed: (
						$scope.taskTabCtrl.taskModel.canExecuteActionByRole('TASK_BLOCK')
						&& $scope.taskTabCtrl.taskModel.canExecuteActionByStatus('TASK_UN_BLOCK')
						&& $scope.taskTabCtrl.taskModel.$isBlocked()
					)
				},
				{
					name: LANG.TASK.LABEL.LCE_NAME.TRY_START,
					action: onTaskLifeCycleEventTrigger,
					args: "TRY_START",
					isDisabled: $scope.taskTabCtrl.taskModel.$isBlocked(),
					subText: $scope.taskTabCtrl.taskModel.$isBlocked() ? LANG.TASK.MESSAGES.TASK_BLOCKED : null,
					isAllowed: (
						$scope.taskTabCtrl.taskModel.canExecuteActionByRole('TRY_START')
						&& $scope.taskTabCtrl.taskModel.canExecuteActionByStatus('TRY_START')
					)
				},
				{
					name: LANG.TASK.LABEL.LCE_NAME.TRY_FINISH,
					action: onTaskLifeCycleEventTrigger,
					args: "TRY_FINISH",
					isDisabled: $scope.taskTabCtrl.taskModel.$isBlocked(),
					subText: $scope.taskTabCtrl.taskModel.$isBlocked() ? LANG.TASK.MESSAGES.TASK_BLOCKED : null,
					isAllowed: (
						$scope.taskTabCtrl.taskModel.canExecuteActionByRole('TRY_FINISH')
						&& $scope.taskTabCtrl.taskModel.canExecuteActionByStatus('TRY_FINISH')
					)
				},
				{
					name: LANG.TASK.LABEL.LCE_NAME.TRY_CLOSE,
					action: onTaskLifeCycleEventTrigger,
					args: "TRY_CLOSE",
					isDisabled: $scope.taskTabCtrl.taskModel.$isBlocked(),
					subText: $scope.taskTabCtrl.taskModel.$isBlocked() ? LANG.TASK.MESSAGES.TASK_BLOCKED : null,
					isAllowed: (
						$scope.taskTabCtrl.taskModel.canExecuteActionByRole('TRY_CLOSE')
						&& $scope.taskTabCtrl.taskModel.canExecuteActionByStatus('TRY_CLOSE')
					)
				},
				{
					name: LANG.TASK.LABEL.TASK_DELETE,
					args: taskId,
					action: askAndDeleteTask,
					btn_type: "md-accent md-raised",
					isAllowed: (
						$scope.taskTabCtrl.taskModel.canExecuteActionByRole('DELETE')
						&& $scope.taskTabCtrl.taskModel.canExecuteActionByStatus('DELETE')
					)
				},
				{
					name: "Audit",
					action: auditClicked,
					isAllowed: true
				}
				];
			angular.forEach(infoMenuItems, function (menuItem) {
				if (menuItem.isAllowed) {
					$scope.taskTabCtrl.optionMenuItems.TAB_INFO.push(menuItem);
				}
			});
			$timeout(angular.noop);
		}

		function askAndDeleteTask() {
			Dialog.confirm({
					title: "Delete Task",
					content: LANG.TASK.LABEL.TASK_DELETE_CONFORM_MSG,
					ok: LANG.BUTTON.DELETE,
					cancel: LANG.BUTTON.CANCEL
				})
				.then(function () {
					blockUI.start(LANG.TASK.TASK_LOADING_MSGS.TASK_DELETE);
					DataProvider.resource.Task.destroy(taskId)
						.then(function (res) {
							$scope.transitionBack();
							blockUI.stop(res.respMsg);
						})
						.catch(function (error) {
							blockUI.stop(error.respMsg, {
								status: 'isError',
								action: LANG.BUTTON.OK
							});
						});
				})
		}

		function taskEditClicked() {
			var task = $scope.taskTabCtrl.taskModel;
			TaskAdminService.UpdateTask(task).then(function (result) {
				$scope.taskTabCtrl.taskModel = result;
			}, null, function (rawResponse) {
				Dialog.showAlert(rawResponse.respMsg);
			}).catch(function (error) {
				if (error.respMsg) {
					Dialog.alert({
						content: error.respMsg,
						ok: LANG.BUTTON.OK
					});
				}
			});
		}

		function onTaskToggleBlock(toBlock) {
			fn_taskToggleBlock(toBlock)
				.then(function (result) {
					refresh();
				})
		}

		function onTaskLifeCycleEventTrigger(eventName) {
			var taskModel = $scope.taskTabCtrl.taskModel;
			var jobModel = $scope.taskTabCtrl.jobModel;

			TasLifeCycleService.showTaskLifecycleEventTriggerDialog(taskModel, eventName).then(function (res) {
				if (res.isSuccess == true) {
					$scope.fetchTaskModelAndJobModel().then(function () {
						initInfoView();
					});

					var toast = $mdToast.simple()
						.content(res.respMsg)
						.position('bottom right')
						.hideDelay(4000);
					$mdToast.show(toast)
						.then(function (res) {
						});
				}

			}).catch(function (error) {
				if (error.respMsg) {
					Dialog.alert({
						content: error.respMsg,
						ok: LANG.BUTTON.OK
					});
				}
			});
		}
		
		function auditClicked() {
			var params = {};
			params.catId = $stateParams.taskId;
			params.catType = CATEGORY_TYPE.TASK;

			blockUI.start("Fetching Audits");
			AuditService.checkAuditList(URL.AUDIT_LIST,params).then(function (res) {
				if (res.results.length > 0) {
					var title = "";
					blockUI.stop();
					AuditService.showAudit(URL.AUDIT_LIST,params,title, res).then(function (res) {

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
					content: err.respMsg,
					ok: "Ok"
				});
			}).finally(function () {
				blockUI.stop();
			});
		}
	}


})();