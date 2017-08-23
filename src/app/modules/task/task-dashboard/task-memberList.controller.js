;
(function () {
	"use strict";

	angular.module('app')
		.controller('TaskMemberViewController', ['$scope', '$stateParams',
			'blockUI', 'mDialog', '$mdToast',
			'Lang', 'TaskAdminService',
			TaskMemberViewController
		]);


	function TaskMemberViewController($scope, $stateParams
		, blockUI, Dialog, $mdToast
		, Lang, TaskAdminService) {

		var LANG = Lang.en.data
			, taskId = $stateParams.taskId
			, taskModel
			, taskAssigneeLoaderFn
			, taskMemberListLoaderFn
			;

		angular.extend($scope, {
			onTaskMemberOptionClick: onTaskMemberOptionClick,
			askAndRemoveTaskMember: askAndRemoveTaskMember,
			askAndRemoveTaskOwner: askAndRemoveTaskOwner,
			startTaskContributorInvitationWorkflow: startTaskContributorInvitationWorkflow,
			refresh: refreshView
		});
		refreshView();

		function startTaskContributorInvitationWorkflow() {
			TaskAdminService.runTaskInvitationWorkflow(taskModel.id)
				.then(function (res) {
					console.log(res)
				})
				.catch(function (err) {
					console.log(err)
				})
			;
		}

		function refreshView() {
			$scope.$parent.fetchTaskModelAndJobModel()
				.then(function (results) {
					taskModel = results[1];
					taskAssigneeLoaderFn = $scope.MU.ServiceRunner
						.buildServiceRunnerFn(function () {
							return taskModel.hasAssignee()
								&& taskModel.fetchAssigneeUser()
									.then(function (user) {
										$scope.TaskAsignee = user;
										buildTaskMembersMenuList();
									})
						}, {showSuccess: false});

					taskMemberListLoaderFn = $scope.MU.ServiceRunner
						.buildServiceRunnerFn(function (pageSize, pageNum) {
							return taskModel.fetchTaskMemberPage(pageSize, pageNum)
								.then(function (users) {
									console.log(taskModel.$_memberCollection);
								});
						}, {showSuccess: false});

					taskAssigneeLoaderFn();
					taskMemberListLoaderFn(25, 1)
						.then(function () {
						});
					buildTaskMembersMenuList();
				});
		}

		//function refreshTaskCreator() {
		//	taskModel.hasCreator()
		//	&& taskModel.fetchCreatorUserModel()
		//		.then(function () {
		//			buildTaskMembersMenuList();
		//		})
		//		.catch(function (err) {
		//
		//		});
		//}

		function buildTaskMembersMenuList() {
			$scope.taskTabCtrl.optionMenuItems.TAB_MEMBER_LIST = [];
			$scope.xtras.selectedTabIndex = 1;

			var memberMenuItems = [
			/**
			 * Task Owner assignment
			 *
			 * Conditions:
			 * - Task should not already be assigned to a owner.
			 * - User should be the task creator
			 */
				{
					name: LANG.TASK.LABEL.ACTION_ASSIGN_OWNER,
					action: taskAssignClicked,
					isAllowed: (
						!taskModel.isTaskClosed()
						&& !taskModel.hasAssignee()
						&& taskModel.amITheCreator()
					)
				},
			/**
			 * Task Contributor invitation conditions
			 *
			 * - The user should be task owner.
			 * - The task should NOT be closed.
			 */
				{
					name: LANG.TASK.LABEL.ACTION_INVITE_CONTRIBUTOR,
					action: onTaskInviteClick,
					isAllowed: (
						taskModel.amITheAssignee()
						&& !taskModel.isTaskClosed()
					)
				},
				{
					name: "View Invitees Status",
					action: onTaskInviteStatusClick,
					isAllowed: (
						taskModel.amITheAssignee()
						&& !taskModel.isTaskClosed()
					)
				}
			];
			angular.forEach(memberMenuItems, function (menuItem) {
				if (menuItem.isAllowed) {
					$scope.taskTabCtrl.optionMenuItems.TAB_MEMBER_LIST.push(menuItem);
				}
			});
		}

		function onTaskInviteClick() {
			TaskAdminService.runTaskInvitationWorkflow(taskModel.id)
				.then(function (res) {
					res && res.respMsg && $scope.MU.showToast(res.respMsg);
				})
		}

		function onTaskInviteStatusClick() {
           	blockUI.start("Loading Task Invites Data..", {
        		status: 'isLoading'
        	});
           	
           	var _params = {
        			taskId : taskId,
        			pageSize: 25,
        			pageNumber: 1
        	}
           	
			TaskAdminService.onTaskInviteStatusList(_params)
			.then(function (resp) {
				if (resp.results.length  > 0) {
					TaskAdminService.onTaskInviteStatusDialog(resp,_params)
					.then(function (result) {
					}).catch(function (err) {
					})
				} else {
					blockUI.stop("No invitations are sent", {
						status: 'isSuccess',
						action: LANG.BUTTON.OK
					})
				}
			}).catch(function (err) {
				Dialog.alert({
					content: err.message,
					ok: "Ok"
				});
			}).finally(function () {
				blockUI.stop();
			});
		}
		
		function taskAssignClicked() {
			var task = $scope.taskTabCtrl.taskModel;
			var job = $scope.taskTabCtrl.jobModel;
			TaskAdminService.AssignTask(job, task).then(function (result) {
				console.log(result);
				if (result.isSuccess == true) {
					refreshView();
				}
			});
		}

		function askAndRemoveTaskMember(user) {
			if (!user || !taskId) return;
			Dialog.confirm({
					title: "Remove Member",
					content: "Do you wish to remove this member ?",
					ok: LANG.BUTTON.REMOVE,
					cancel: LANG.BUTTON.CANCEL
				})
				.then(function () {
					blockUI.start(LANG.JOB.JOB_LOADING_MSGS.REMOVING_MEMBER);
					taskModel.removeTaskMember(user.taskAssignmentId)
						.then(function (res) {
							refreshView();
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

		function askAndRemoveTaskOwner(user) {
			if (!user || !taskId) return;
			Dialog.confirm({
					title: "Remove Owner",
					content: "Do you wish to remove the owner of this task ?",
					ok: LANG.BUTTON.REMOVE,
					cancel: LANG.BUTTON.CANCEL
				})
				.then(function () {
					blockUI.start(LANG.JOB.JOB_LOADING_MSGS.REMOVING_MEMBER);
					taskModel.removeTaskOwner(user.taskOwnerAssignmentId)
						.then(function (res) {
							refreshView();
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

		function onTaskMemberOptionClick(user, isAdmin) {
			var userActions = [{
				text: "View Profile",
				value: "profile"
			}];

			!isAdmin
			&& userActions.push({
				text: "Remove member",
				value: "removeMember"
			});

			Dialog.showListDialog(userActions)
				.then(function (selection) {
					switch (selection.value) {
						case 'profile':
							$scope.transitionTo('root.app.user', {id: $scope.jobModel.originator.id});
							break;

						case 'removeMember':
							askAndRemoveTaskMember(user.id);
							break;
					}
				})
		}
	}

})();