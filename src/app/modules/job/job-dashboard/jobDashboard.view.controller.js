/**
 * Created by sudhir on 16/9/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.controller('JobDashboardViewController', [
			'$scope', '$timeout', '$controller', '$q', '$stateParams',
			'DataProvider', 'ROLE', 'Lang', 'JOB_LIFECYCLE_EVENT',
			'mDialog', 'blockUI', '$state',
			JobDashboardViewController
		]);

	function JobDashboardViewController($scope, $timeout, $controller, $q, $stateParams
		, DataProvider, ROLE, Lang, JOB_LIFECYCLE_EVENT
		, Dialog, blockUI, $state) {

		var self = this,
			jobId = $stateParams.jobId,
			LANG = Lang.en.data;
		// default_tab = $stateParams.tab || 'TAB_INFO';

		angular.extend(self, $controller('ViewBaseController', {
			$scope: $scope
		}));
		angular.extend(self, $controller('ViewDataBaseController', {
			$scope: $scope
		}));
		var jobHistoryLoader = DataProvider.PaginatedListLoaderFactory(
			DataProvider.resource.JobHistory, 'findAll', {
				jobId: jobId
			}, 25, {
				apiParams: {
					bypassCache: true
				}
			});

		self.tabs = ['TAB_INFO', 'TAB_MEMBER_LIST', 'TAB_CHAT', 'TAB_TALK','TAB_VAULT', 'TAB_TASK', 'TAB_FORM', 'TAB_AUDIT'];

		var jobId = $stateParams.jobId;

		$scope.jobOrganisation = {};
		$scope.isChatTabEnabled = false;
		$scope.ui = {
			flags: {
				isNavigateDone: false,
				isSendingMessage: false,
				isInARoom: false
			}
		};
		$scope.xtras = {
			flag: {
				isAllowed_add_file: true,
				fileDownloadInProgress: false
			},
			title: "Job Details",
			subtitle: "",
			selectedTabIndex: 0
		};
		$scope.data = {
			jobVaultFiles: null,
			vaultInfo: true
		};

		$scope.JobTabCtrl = {
			optionMenuItems: [],
			tab_curr: ''
		};

		$scope.JobTabCtrl.jobModel = DataProvider.resource.Job.get(jobId);
		
		$scope.JOB_LIFECYCLE_EVENT = JOB_LIFECYCLE_EVENT;

		$scope.onTabSelect = onTabSelect;

		$scope.fetchJobDetails
			= $scope.MU.ServiceRunner.buildServiceRunnerFn(
			fetchJobDetails, {showSuccess: false});

		getTabIndex();

		function getTabIndex() {

			var currentStateTab = $state.current.name;

			if ($state.current.name.indexOf('jobProfile') != -1) {
				$scope.xtras.selectedTabIndex = 0;
			} else if ($state.current.name.indexOf('jobMembers') != -1) {
				$scope.xtras.selectedTabIndex = 1;
			} else if ($state.current.name.indexOf('jobChat') != -1) {
				$scope.xtras.selectedTabIndex = 2;
			} else if ($state.current.name.indexOf('jobTalk') != -1) {
				$scope.xtras.selectedTabIndex = 3;
			} else if ($state.current.name.indexOf('jobVault') != -1) {
				$scope.xtras.selectedTabIndex = 4;
			} else if ($state.current.name.indexOf('jobTask') != -1) {
				$scope.xtras.selectedTabIndex = 5;
			} else if ($state.current.name.indexOf('jobForm') != -1) {
				$scope.xtras.selectedTabIndex = 6;
			} else {
				$scope.xtras.selectedTabIndex = 0;
			}
		}

		function fetchJobDetails(options) {
			$scope.MU.toolbarLoader.async_active = true;
			var deferred = $q.defer();
			DataProvider.resource.Job.find(jobId,
				angular.extend({
					bypassCache: true,
					files: true,
					contributors: true,
					tasks: true
				}, options || {}))
				.then(function (jobModel) {
					$scope.JobTabCtrl.jobModel = jobModel;
					$scope.xtras.title = jobModel.title;
					$scope.xtras.subTitle = jobModel.getFullPath();
					$scope.JobChatroomNickName = 'U' + $scope.session.userInfo.id + '-J' + $scope.JobTabCtrl.jobModel.id;

					checkIsVisitor(jobModel.roles);
					$scope.isChatTabEnabledFun();
					deferred.resolve(jobModel);

				}, null, function (noti) {
					deferred.notify(noti)
				})
				.catch(function (error) {
					deferred.reject(error);
				})
				.finally(function () {
					$scope.MU.toolbarLoader.async_active = false;
				});
			return deferred.promise;
		}

		function checkIsVisitor(roles) {

			for (var i = 0; i < roles.length; i++) {
				if (roles[i] == ROLE.JOB_VISITOR) {
					$scope.JobTabCtrl.isJobVisitor = true;
					break;
				} else {
					$scope.JobTabCtrl.isJobVisitor = false;
				}
			}

		}

		function onTabSelect(tabName) {
			switch (tabName) {
				case "TAB_INFO":
					_init_InfoTab();
					break;
				case "TAB_MEMBER_LIST":
					_init_memberListTab();
					break;
				case "TAB_CHAT":
					_init_chatTab();
					break;
				case "TAB_VAULT":
					_init_vaultTab();
					break;
				case "TAB_TASK":
					_init_taskTab();
					break;
				case "TAB_AUDIT":
					_init_AuditTab();
					break;
				case "TAB_TALK":
					_init_talkTab();
					break;
				case "TAB_FORM":
					_init_FormTab();
					break;

			}
		}

		function _init_InfoTab() {

			if ($state.current.name.indexOf('jobProfile') == -1) {

				$scope.JobTabCtrl.tab_curr = "TAB_INFO";
				$scope.xtras.selectedTabIndex = 0;
				$scope.transitionTo('root.app.job-view.jobProfile', {
					jobId: parseInt($stateParams.jobId),
				}, {
					REPLACE_STATE: true
				});

			}
		}

		function _init_chatTab() {

			if ($state.current.name.indexOf('jobChat') == -1) {

				$scope.JobTabCtrl.tab_curr = "TAB_CHAT";
				$scope.xtras.selectedTabIndex = 2;
				$scope.transitionTo('root.app.job-view.jobChat', {
					jobId: parseInt($stateParams.jobId),
				}, {
					REPLACE_STATE: true
				});

			}

		}

		function _init_vaultTab() {
			if ($state.current.name.indexOf('jobVault') == -1) {
				$scope.JobTabCtrl.tab_curr = "TAB_VAULT";
				$scope.xtras.selectedTabIndex = 4;
				$scope.transitionTo('root.app.job-view.jobVault', {
					jobId: parseInt($stateParams.jobId),
				}, {
					REPLACE_STATE: true
				});
			}

		}

		function _init_taskTab() {

			if ($state.current.name.indexOf('jobTask') == -1) {
				$scope.JobTabCtrl.tab_curr = "TAB_TASK";
				$scope.xtras.selectedTabIndex = 5;
				$scope.transitionTo('root.app.job-view.jobTask', {
					jobId: parseInt($stateParams.jobId),
				}, {
					REPLACE_STATE: true
				});
			}
		}

		function _init_memberListTab() {

			if ($state.current.name.indexOf('jobMembers') == -1) {

				$scope.JobTabCtrl.tab_curr = "TAB_MEMBER_LIST";
				$scope.xtras.selectedTabIndex = 1;
				$scope.transitionTo('root.app.job-view.jobMembers', {
					jobId: parseInt($stateParams.jobId),
				}, {
					REPLACE_STATE: true
				});
			}
		}

		function _init_AuditTab() {
			if ($state.current.name.indexOf('jobAudit') == -1) {
				$scope.JobTabCtrl.tab_curr = "TAB_AUDIT";
				$scope.xtras.selectedTabIndex = 6;
				$scope.transitionTo('root.app.job-view.jobAudit', {
					jobId: parseInt($stateParams.jobId),
				}, {
					REPLACE_STATE: true
				});

			}
		}
		function _init_talkTab() {
			if ($state.current.name.indexOf('jobTalk') == -1) {
				$scope.JobTabCtrl.tab_curr = "TAB_TALK";
				$scope.xtras.selectedTabIndex = 3;
				$scope.transitionTo('root.app.job-view.jobTalk', {
					jobId: parseInt($stateParams.jobId),
					orgId: parseInt($stateParams.orgId),
				}, {
					REPLACE_STATE: true
				});

			}
		}
		
		function _init_FormTab() {

			if ($state.current.name.indexOf('jobForm') == -1) {

				$scope.JobTabCtrl.tab_curr = "TAB_FORM";
				$scope.xtras.selectedTabIndex = 6;
				$scope.transitionTo('root.app.job-view.jobForm', {
					jobId: parseInt($stateParams.jobId),
				}, {
					REPLACE_STATE: true
				});

			}
		}

		// Chatroom controls
		$scope.chatFormModel = {
			newMessage: null
		};

		$scope.sendNewMessage = function ($event, message) {
			$event.preventDefault();
			$event.stopImmediatePropagation();
			$event.stopPropagation();
			$scope.$broadcast('newChatroomMessage', {
				message: message
			})
		};
		$scope.chatroomEvent = function (event) {
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
		
		$scope.isChatTabEnabledFun = function() {
	        if ($scope.JobTabCtrl.jobModel.owner == null) {
	        	$scope.isChatTabEnabled = true;
			} else if ($scope.JobTabCtrl.jobModel.originator.id != $scope.JobTabCtrl.jobModel.owner.id) {
				$scope.isChatTabEnabled = false;
			} else if ($scope.JobTabCtrl.jobModel.originator.id == $scope.JobTabCtrl.jobModel.owner.id && $scope.JobTabCtrl.jobModel.contributors=='') {
				$scope.isChatTabEnabled = true;
			} else if ($scope.JobTabCtrl.jobModel.contributors != '' && $scope.JobTabCtrl.jobModel.contributors.length == 1 && $scope.JobTabCtrl.jobModel.originator.id == $scope.JobTabCtrl.jobModel.contributors[0].userid) {
				$scope.isChatTabEnabled = true;
			} else {
				$scope.isChatTabEnabled = false;
			}
		}
		
	}
})();