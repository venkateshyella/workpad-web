/**
 * Created by sudhir on 27/5/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.service('TaskAdminService', TaskAdminService)
	;

	function TaskAdminService(Dialog, $q, $timeout,
		DataProvider, ServiceRunner, blockUI, Lang, Session,Connect,URL) {
		var LANG = Lang.data;
		return {
			createTaskToggleServiceRunner: createTaskToggleServiceRunner,
			UpdateTask: UpdateTask,
			CreateTask: CreateTask,
			AssignTask: AssignTask,
			runTaskInvitationWorkflow: runTaskInvitationWorkflow,
			onTaskInviteStatusList : onTaskInviteStatusList,
			onTaskInviteStatusDialog : onTaskInviteStatusDialog
		};

		/**
		 * Task Contributor invitation workflow
		 *
		 * @param taskId Id of the task.
		 * @param options
		 */
		function runTaskInvitationWorkflow(taskId, options) {
			console.log(Lang);
			var deferred = $q.defer();

			var taskModel;

			try {
				_loadTask()
					.then(_loadTask)
					.then(_showTaskContributorInvitationMaker)
					.then(function (result) {
						deferred.resolve(result)
					})
					.catch(function (err) {
						deferred.reject(err);
					});
			} catch (e) {
				blockUI.stop();
				deferred.reject({
					respMsg: LANG.ERROR.DEFAULT
				});
			}


			function _loadTask() {
				blockUI.start();
				return DataProvider.resource.Task.find(taskId)
					.then(function (task) {
						taskModel = task;
						return taskModel;
					})
					.finally(function () {
						blockUI.stop();
					});
			}

			function _showTaskContributorInvitationMaker() {
				var deferred = $q.defer();

				Dialog.show({
						templateUrl: 'app/modules/task/templates/task-contributor-invite.dialog.tpl.html',
						clickOutsideToClose: false,
						locals: {
							task: taskModel,
							LANG: LANG
						},
						controller: ['$scope', '$mdDialog', 'locals',
							TaskContributorInvitationDialogController]
					})
					.then(function (res) {
						deferred.resolve(res);
					})
					.catch(function (err) {
						deferred.reject();
					})
					.finally(function () {

					});

				return deferred.promise;
			}

			function _queryForTaskContributor(key) {
				return [];
			}

			return deferred.promise;
		}

		function TaskContributorInvitationDialogController($scope, $mdDialog, locals) {
			var taskModel = locals.task
				, queryFn = _.throttle(function (taskModel, key) {
				$scope.error = null;
				$scope.loading = true;
				$timeout();
				return _sendTaskContributorSearchQuery(taskModel, key)
					.then(function (res) {
						$scope.error = null;
						$scope.resultUserList = _.uniq(res, 'id');
						if ($scope.resultUserList.length == 0) {
							$scope.error = {
								dispText: locals.LANG.TASK.MESSAGES.NO_MATCH_FOUND_PREFIX_INVITE_CONTRIBUTOR + key + '"'
							}
						}
					})
					.catch(function (err) {
						$scope.error = {
							dispText: (err && err.respMsg) || ""
						}
					})
					.finally(function () {
						$scope.loading = false;
					})
					;
			}, 300, {leading: false, trailing: true});

			angular.extend($scope, {
				placeholderText: locals.LANG.TASK.LABEL.PLACEHOLDER_CONTRIBUTOR_SEARCH_INPUT,
				inviteLabel: locals.LANG.TASK.LABEL.LABEL_INVITE_CONTRIBUTOR,
				triggerFocus: false,
				searchKey: "", resultUserList: [], selectedUsersList: [],
				cancel: function () {
					$mdDialog.cancel();
				},
				clearSearchKey: function () {
					$scope.error = null;
					$scope.loading = false;
					$scope.searchKey = "";
				},
				onItemSelect: function (user) {
					$scope.clearSearchKey();
					$scope.resultUserList = [];
					if (!_.find($scope.selectedUsersList, function (userItem) {
							return user.id == userItem.id
						})) {
						$scope.selectedUsersList.push(user)
					}
				},
				removeSelectedUser: function (user) {
					_.remove($scope.selectedUsersList, function (userItem) {
						return user.id == userItem.id
					});
				},
				onSendInviteClick: function () {
					_prepareAndSendInvitationReq();
				}
			});

			$scope.$watch('searchKey', function (newVal, oldVal) {
				if (newVal != oldVal && newVal.length > 0) {
					queryFn(taskModel, newVal);
				}
				else {
					$scope.error = null;
				}
			});

			$scope.triggerFocus = true;

			function _prepareAndSendInvitationReq() {
				try {
					var inviteesUserIds = _.pluck($scope.selectedUsersList, 'id');
					taskModel.sendTaskContributorInvitation(inviteesUserIds)
						.then(function (res) {
							$mdDialog.hide(res);
						})
						.catch(function (err) {
							var errMessage = err.respMsg;
							blockUI.stop(errMessage, {
								status: 'isError',

								action: LANG.BUTTON.OK
							})
						})
						.finally(function () {
							blockUI.stop();
						})
					;
				} catch (e) {
					blockUI.stop();
				}
				blockUI.start();
			}
		}

		function _sendTaskContributorSearchQuery(taskModel, key) {
			return taskModel.searchTaskContributorInvite(key);
		}

		function UpdateTask(task) {
			var taskModel = angular.copy(task);
			var deferred = $q.defer();
			Dialog.show({
				// locals: { task: task },
				controller: ['$scope', '$controller', '$mdDialog', 'blockUI', 'TaskService', 'mDialog',
					function TaskUpdateDialogController($scope, $controller, $mdDialog, blockUI, TaskService, mDialog) {
						var self = this;

						$scope.form = {};
						$scope.formModel = {};
						$scope.formModel.update_task = taskModel;
						$scope.cancel = $mdDialog.cancel;
						$scope.submit = function submit() {


							blockUI.start("Updating Task", {
								status: 'isLoading'
							});

							TaskService.submitUpdateTaskReq({
									taskName: taskModel.title,
									taskDesc: taskModel.desc,
									id: taskModel.id
								})
								.then(function (result) {
									blockUI.stop();
									$mdDialog.hide();
									deferred.resolve(result);
								}, null, function (rawResponse) {
									deferred.notify(rawResponse);
								}).catch(function (error) {
								/*blockUI.stop(error.respMsg, {
								 status: 'isError',
								 action: 'Ok'
								 });*/
								blockUI.stop();
								$mdDialog.hide();
								deferred.reject(error);

							});
						};

					}
				],
				templateUrl: 'app/modules/task/templates/task-update.dialog.tpl.html',
				 clickOutsideToClose: false
			});
			return deferred.promise;
		}

		function createTaskToggleServiceRunner(task) {
			return ServiceRunner.buildServiceRunnerFn(function (toBlock) {
				return task.req_toggle_block(toBlock);
			}, {
				loadingMessage: LANG.TASK.MESSAGES.UPDATING_TASK,
				blockUI: true,
				alertSuccess: false,
				notifySuccess: true
			})
		}

		function CreateTask() {

			var deferred = $q.defer();
			Dialog.show({
				// locals: { task: task },
				controller: ['$scope', '$controller', '$stateParams', '$mdDialog', 'blockUI', 'TaskService', 'mDialog',
					function TaskCreateDialogController($scope, $controller, $stateParams, $mdDialog, blockUI, TaskService, mDialog) {
						var self = this;

						$scope.form = {};
						$scope.formModel = {};
						$scope.cancel = $mdDialog.cancel;
						$scope.submit = function submit() {


							blockUI.start("Creating Task", {
								status: 'isLoading'
							});

							TaskService.submitCreateTaskReq({
									jobId: $stateParams.jobId,
									taskTitle: $scope.formModel.create_task.title,
									taskDesc: $scope.formModel.create_task.desc,
									taskObj: $scope.formModel.create_task.obj
								})
								.then(function (result) {
									blockUI.stop();
									$mdDialog.hide();
									deferred.resolve(result);
								}).catch(function (error) {
								/*blockUI.stop(error.respMsg, {
								 status: 'isError',
								 action: 'Ok'
								 });*/

								blockUI.stop();
								$mdDialog.hide();
								deferred.reject(error);

							});
						};

					}
				],
				templateUrl: 'app/modules/task/templates/task-create.dialog.tpl.html',
				 clickOutsideToClose: false
			});
			return deferred.promise;
		}

		function AssignTask(jobModel, task) {
			var taskModel = angular.copy(task);
			return Dialog.show({
				controller: ['$scope', '$controller', '$mdDialog', 'blockUI', 'mDialog',
					function TaskAssignDialogController($scope, $controller, $mdDialog, blockUI, mDialog) {
						$scope.cancel = $mdDialog.cancel;
						$scope.jobContributorList = [];

						getJobContributorsList(jobModel);

						$scope.selectedAsignee = $scope.jobContributorList;

						$scope.assignTask = assignTask;

						$scope.selectContributor = selectContributor;

						function selectContributor(index) {

							for (var i = 0; i < $scope.jobContributorList.length; i++) {
								$scope.jobContributorList[i].isSelected = false;
							}
							$scope.jobContributorList[index].isSelected = true;
							$scope.selectedContributor = $scope.jobContributorList[index];
						}

						function assignTask() {

							var contributorId = $scope.selectedContributor.id;
							var taskId = task.id;

							blockUI.start("Assigning task to " + $scope.selectedContributor.userFirstName + " " + $scope.selectedContributor.userLastName);
							task.assign_task(contributorId, taskId)
								.then(function (res) {
									blockUI.stop();
									$mdDialog.hide(res);
								})
								.catch(function (err) {
									blockUI.stop();
									$mdDialog.hide(err);

								});
						}

						function getJobModel() {
							var jobId = parseInt(task.jobId);
							// Pre-populate job model;
							$scope.jobModel = DataProvider.resource.Job.get(jobId)
							DataProvider.resource.Job.find(jobId, {
									bypassCache: true,
									files: true
								})
								.then(function (jobModel) {
									$scope.jobModel = DataProvider.resource.Job.get(jobId);
									if ($scope.taskModel.assigneeId) {
										getJobContributorsList();
									}
									$scope.isJobOriginator = $scope.jobModel.isOriginator();
									$scope.isJobOwner = $scope.jobModel.amITheOwner();

								})


						}

						function getJobContributorsList(jobModel) {
							blockUI.start("Loading Contributors..", {
								status: 'isLoading'
							});

							jobModel.findContributors({}, {
									bypassCache: true
								})
								.then(function (JobContributorList) {

									$scope.jobContributorList = JobContributorList.resp.results;
									for (var i = 0; i < $scope.jobContributorList.length; i++) {
										$scope.jobContributorList[i].isSelected = false;
									}

									if ($scope.jobContributorList.length == 0) {
										$scope.showNoDataMsg = true;
										$scope.loadingImage = false;
									} else {
										$scope.showMsgJobContainer = false;
										$scope.loadingImage = false;
									}

								})
								.catch(function (error) {
								})
								.finally(function () {
									blockUI.stop();
								});
						}

					}
				],
				templateUrl: 'app/modules/task/templates/task-assign.dialog.tpl.html',
				 clickOutsideToClose: false
			});

		}

        function onTaskInviteStatusList(_params) {
        	var deferred = $q.defer();
			Connect.get(URL.TASK_MEMBERS_INVITEES_STATUS, _params).then(function (res) {
				return deferred.resolve(res.resp);
        	}).catch(function (error) {
        		deferred.reject();
        	}).finally(function () {
        	});
			return deferred.promise;
        }
		
		function onTaskInviteStatusDialog(resp,params) {
            var deferred = $q.defer();
            Dialog.show({
                controller: ['$scope', '$controller','Lang','$mdDialog', function InviteesStatusController($scope, $controller,Lang,$mdDialog) {  
                	
                	$scope.LANG = LANG;
                	$scope.isNextPageAvailable = false;
        			$scope.loadingNext = false;

        			$scope.reqObj = params;
        			$scope.TaskInviteesSelected = [];

        			angular.forEach(resp.results, function(resp) {
        				$scope.TaskInviteesSelected.push(resp);
        			});


        			function checkNextPgAvailability(resultCount) {
        				if ($scope.TaskInviteesSelected.length < resultCount) {
        					$scope.isNextPageAvailable = true;
        				} else {
        					$scope.isNextPageAvailable = false;
        				}
        			}

        			$scope.loadNext = function() {
        				$scope.loadingNext = true;
        				$scope.reqObj.pageNumber += 1;
        				onTaskInviteStatus();
        			}

        			function onTaskInviteStatus() {
        				onTaskInviteStatusList($scope.reqObj)
        				.then(function (res) {
        					angular.forEach(res.results, function(res) {
        						$scope.TaskInviteesSelected.push(res);
        					});
        					checkNextPgAvailability(res.paginationMetaData.totalResults);
        					$scope.loadingNext = false;
        				}).catch(function (err) {
        					Dialog.alert({
        						content: err.message,
        						ok: "Ok"
        					});
        				}).finally(function () {
        				});
        			}

        			$scope.MU = {
        					getDisplayDateTime: mobos.Utils.getDisplayDateTime		
        			}   

        			$scope.cancel = function() {
        				$mdDialog.cancel();
        			};

        			checkNextPgAvailability(resp.paginationMetaData.totalResults);
                	
                }],
                templateUrl: 'app/modules/task/templates/task-contributor-invitees-status.html',
                clickOutsideToClose:false
            }).then(function(result) {
                deferred.resolve(result);
            });
            return deferred.promise;
		}
	}


	TaskAdminService.$inject = [
		'mDialog', '$q', '$timeout', 'DataProvider', 'ServiceRunner', 'blockUI', 'Lang','Session','Connect','URL'
	];


})();
