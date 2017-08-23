;
(function () {
	"use strict";

	angular.module('app')
		.controller('TaskDashboardViewController', ['$scope', '$q', '$state', '$stateParams',
			'blockUI', 'DataProvider', 'mDialog', '$timeout',
			'TasLifeCycleService', 'Lang', 'TaskAdminService', 'Session',
			'TaskVaultAdmin', 'FileSystem', 'FileService',
			TaskDashboardViewController
		]);


	function TaskDashboardViewController($scope, $q, $state, $stateParams
		, blockUI, DataProvider, Dialog, $timeout
		, TasLifeCycleService, Lang, TaskAdminService, Session
		, TaskVaultAdmin, FileSystem, FileService) {

		var self = this,
			LANG = Lang.en.data,
			taskId = $stateParams.taskId,
			jobId = $stateParams.jobId;
		
		$scope.isChatTabEnabled = false;

		self.tabs = ['TAB_INFO', 'TAB_MEMBER_LIST', 'TAB_CHAT', 'TAB_TALK', 'TAB_VAULT', 'TAB_AUDIT'];

		angular.extend($scope, {
			chatroomEvent: chatroomEvent,
			sendNewMessage: sendNewMessage,
			onTabSelect: onTabSelect,
			fetchTaskModelAndJobModel: fetchTaskModelAndJobModel
		});

		angular.extend($scope, {
			xtras: {},
			chatFormModel: {
				newMessage: null
			},
			ui: {
				flags: {
					isSendingMessage: false,
					isInARoom: false
				}
			},
			taskTabCtrl: {
				jobModel: DataProvider.resource.Job.get($stateParams.jobId),
				taskModel: DataProvider.resource.Task.get($stateParams.taskId),
				optionMenuItems: []
			}
		});

		function chatroomEvent(event) {
			if (event == true) {
				$scope.ui.flags.isInARoom = true;
				return;
			}
			switch (event) {
				case 'join':
					$scope.ui.flags.isInARoom = true;
					break;
				case 'sent':
					$scope.ui.flags.isSendingMessage = false;
					$scope.chatFormModel.newMessage = "";
					break;
				case 'sending':
					$scope.ui.flags.isSendingMessage = true;
					break;
				case 'error': 
					$scope.ui.flags.isSendingMessage = false;
					$scope.chatFormModel.newMessage = "";
					break;
				default:
			}
		}

		function sendNewMessage($event, message) {
			$event.preventDefault();
			$event.stopImmediatePropagation();
			$event.stopPropagation();
			$scope.$broadcast('newChatroomMessage', {
				message: message
			})
		}


		function fetchTaskModelAndJobModel() {
			var deferred = $q.defer();
			$q.all([$q.when(initJobModel()), $q.when(initTaskModel())])
				.then(function (results) {
					var jobModel = results[0];
					var taskModel = results[1];
					deferred.resolve(results);
				}).catch(function (errors) {
				deferred.reject(errors);
			});
			return deferred.promise;
		}

		function onTabSelect(tabName) {
			switchTab(tabName);
			function switchTab(tabName) {

				$scope.tab_curr = tabName;
				switch (tabName) {
					case "TAB_INFO":
						_init_TAB_INFO();
						break;
					case "TAB_MEMBER_LIST":
						_init_TAB_MEMBER_LIST();
						break;
					case "TAB_CHAT":
						$scope.xtras.selectedTabIndex = 2;
						$scope.transitionTo('root.app.task-dashboard.taskChat', {
							jobId: parseInt($stateParams.jobId),
							taskId: parseInt($stateParams.taskId)
						}, {
							REPLACE_STATE: true
						});
						break;
					case "TAB_VAULT":
						_init_TAB_VAULT();
						break;
					case "TAB_TALK":
						_init_TAB_TALK();
						break;

          case "TAB_AUDIT":
            _init_TAB_AUDIT();
            break;

				}

			}

		}

		function initJobModel() {

			var deferred = $q.defer();
			DataProvider.resource.Job.find($stateParams.jobId, {
					bypassCache: true
				})
				.then(function (job) {
					$scope.taskTabCtrl.jobModel = DataProvider.resource.Job.get(jobId);
					deferred.resolve(job);
				}).catch(function (error) {
				deferred.reject(error);
			});
			return deferred.promise;

		}

		function initTaskModel() {
			var deferred = $q.defer();

			$scope.isAccessProvided = false;
			
			DataProvider.resource.Task.find($stateParams.taskId, {
					bypassCache: true
				})
				.then(function (task) {
					$scope.taskTabCtrl.taskModel = DataProvider.resource.Task.get(taskId);
					if  ($scope.taskTabCtrl.taskModel.roles.length > 0)
						$scope.isAccessProvided = true; 
					$scope.TaskChatroomNickName = 'U' + Session.userId + '-J' + $scope.taskTabCtrl.taskModel.id;
					$scope.isChatTabEnabledFun();
					deferred.resolve(task);

				}).catch(function (error) {
				deferred.reject(error);

			});
			return deferred.promise;

		}

		function _init_TAB_INFO() {

			if ($state.current.name.indexOf('taskProfile') == -1) {
				$scope.transitionTo('root.app.task-dashboard.taskProfile', {
					jobId: parseInt($stateParams.jobId),
					taskId: parseInt($stateParams.taskId)
				}, {
					REPLACE_STATE: true
				});
			}

		}

		function _init_TAB_MEMBER_LIST() {
			if ($state.current.name.indexOf('taskMembers') == -1) {
				$scope.transitionTo('root.app.task-dashboard.taskMembers', {
					jobId: parseInt($stateParams.jobId),
					taskId: parseInt($stateParams.taskId)
				}, {
					REPLACE_STATE: true
				});
			}
		}

		function _init_TAB_VAULT() {
			$scope.transitionTo('root.app.task-dashboard.taskVault', {
				jobId: parseInt($stateParams.jobId),
				taskId: parseInt($stateParams.taskId)
			}, {
				REPLACE_STATE: true
			});
		}

    function _init_TAB_AUDIT() {
      $scope.transitionTo('root.app.task-dashboard.taskAudit', {
        jobId: parseInt($stateParams.jobId),
        taskId: parseInt($stateParams.taskId)
      }, {
        REPLACE_STATE: true
      });
    }
    
	function _init_TAB_TALK() {
	      $scope.transitionTo('root.app.task-dashboard.taskTalk', {
	          jobId: parseInt($stateParams.jobId),
	          taskId: parseInt($stateParams.taskId)
	        }, {
	          REPLACE_STATE: true
	        });
	      }
    
    $scope.isChatTabEnabledFun = function() {
    	if ($scope.taskTabCtrl.taskModel.owner == null) {
    		$scope.isChatTabEnabled = true;
    	} else if ($scope.taskTabCtrl.taskModel.originator.id != $scope.taskTabCtrl.taskModel.owner.id) {
    		$scope.isChatTabEnabled = false;
    	} else if ($scope.taskTabCtrl.taskModel.originator.id == $scope.taskTabCtrl.taskModel.owner.id && $scope.taskTabCtrl.taskModel.contributors=='') {
    		$scope.isChatTabEnabled = true;
    	} else if ($scope.taskTabCtrl.taskModel.contributors != '' && $scope.taskTabCtrl.taskModel.contributors.length == 1 && $scope.taskTabCtrl.taskModel.originator.id == $scope.taskTabCtrl.taskModel.contributors[0].id) {
    		$scope.isChatTabEnabled = true;
    	} else {
    		$scope.isChatTabEnabled = false;
    	}
    }
    
	}


})();