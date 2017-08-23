;
(function () {
	"use strict";

	angular.module('app')
		.controller('GroupDashboardViewController', [
			'$scope', '$state', '$stateParams', 'blockUI',
			'DataProvider', 'mDialog', '$timeout',
			'Lang', 'Session', '$q', 'ROLE', GroupDashboardViewController])
	;

	function GroupDashboardViewController($scope, $state, $stateParams, blockUI
		, DataProvider, Dialog, $timeout
		, Lang, Session, $q, ROLE) {

		var LANG = Lang.en.data;

		$scope.xtras = {
			selectedTabIndex: 0
		};

		$scope.groupTabCtrl = {
			groupId: null,
			optionMenuItems: [],
			orgModel: {},
			groupModel: {}
		};

		$scope.onTabSelect = onTabSelect;
		var groupId = $stateParams.groupId;

		$scope.ui = {
			flags: {
				isSendingMessage: false,
				isInARoom: false,
				sendMessage_inProgress: false
			}
		};

		var orgId = $stateParams.orgId;


		// $scope.orgTabCtrl.orgId = $stateParams.orgId;

		$scope.groupTabCtrl.orgModel = DataProvider.resource.Organisation.get($stateParams.orgId);
		$scope.groupTabCtrl.groupModel = DataProvider.resource.Group.get($stateParams.groupId) || {};

		$scope.getGroupModelAndOrgModel = getGroupModelAndOrgModel;


		if ($scope.groupTabCtrl.groupModel) {
			checkIsGroupVisitor();
		}

		// Chatroom controls
		$scope.chatFormModel = {
			newMessage: null
		};

		$scope.sendNewMessage = function (message) {
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
					$scope.ui.flags.sendMessage_inProgress = false;
					break;
				case 'sending':
					$scope.ui.flags.isSendingMessage = true;
					$scope.ui.flags.sendMessage_inProgress = true;
					break;
				case 'error': 
					$scope.ui.flags.isSendingMessage = false;
					$scope.chatFormModel.newMessage = "";
					$scope.ui.flags.sendMessage_inProgress = false;
					break;
				default:
			}
		};
		// -------------------

		function getGroupModelAndOrgModel() {
			var deferred = $q.defer();
			$q.all([$q.when(getOrgDetails()), $q.when(getGroupDetails())])
				.then(function (results) {
					var org = results[0];
					var group = results[1];
					deferred.resolve(group);
				}).catch(function (err) {
				deferred.reject(err);
			});
			return deferred.promise;
		}

		function getGroupDetails() {

			var deferred = $q.defer();

			if (groupId) {

				blockUI.start("Loading Room details..", {
					status: 'isLoading'
				});
				DataProvider.resource.Group.find(groupId, {
						bypassCache: true,
						params: {
							orgId: parseInt($stateParams.orgId),
							grpId: parseInt($stateParams.groupId)
						}
					})
					.then(function (group) {
						$scope.groupTabCtrl.groupModel = group;
						$scope.GroupChatroomNickName = 'U' + Session.userId + '-J' + $scope.groupTabCtrl.groupModel.id;
						checkIsGroupVisitor();
						deferred.resolve(group);
					})
					.catch(function (error) {
						deferred.reject(error);
					})
					.finally(function () {
						blockUI.stop();
					});
			}
			return deferred.promise;
		}

		function getOrgDetails() {

			var deferred = $q.defer();
			if (orgId) {

				blockUI.start("Loading WorkSpace details..", {
					status: 'isLoading'
				});
				DataProvider.resource.Organisation.find(orgId, {
						bypassCache: true,
						orgId: orgId
					})
					.then(function (org) {
						$scope.groupTabCtrl.orgModel = org;
						deferred.resolve(org);
					})
					.catch(function (error) {
						deferred.reject(err);
					})
					.finally(function () {
						blockUI.stop();
					});
			}
			return deferred.promise;
		}

		function checkIsGroupVisitor() {
			$scope.groupTabCtrl.isGroupVisitor = ($scope.groupTabCtrl.groupModel.role == ROLE.GROUP_VISITOR);
		}

		function onTabSelect(tabName) {
			switch (tabName) {
				case "TAB_INFO":
					$scope.tab_curr = tabName;
					_init_TAB_INFO();
					break;
				case "TAB_MEMBER_LIST":
					$scope.tab_curr = tabName;
					_init_TAB_MEMBER_LIST();
					break;
				case "TAB_GROUPS":
					$scope.tab_curr = tabName;
					_init_TAB_GROUPS();
					break;
				case "TAB_CHAT":
					//$scope.xtras.selectedTabIndex = 3;
					$scope.tab_curr = tabName;
					$scope.transitionTo('root.app.group-dashboard.groupChat', {
						orgId: parseInt($stateParams.orgId),
						groupId: parseInt($stateParams.groupId)
					}, {
						REPLACE_STATE: true
					});
					break;
				case "TAB_JOBS":
					$scope.tab_curr = tabName;
					_init_TAB_JOBS();
					break;
				case "TAB_VAULT":
					$scope.tab_curr = tabName;
					_init_TAB_VAULT();
					break;
				case "TAB_ANALYSIS":
					$scope.tab_curr = tabName;
					_init_TAB_ANALYSIS();
					break;

				case "TAB_AUDIT":
					$scope.tab_curr = tabName;
					_init_TAB_AUDIT();
					break;
					
				case "TAB_GROUP_EVENTS":	
					$scope.tab_curr = tabName;
					_init_TAB_GROUP_EVENTS();
					break;
					
				case "TAB_TEMPLATE":
					$scope.tab_curr = tabName;
					_init_TAB_TEMPLATE();
					break;
					
				case "TAB_TALK":
					$scope.tab_curr = tabName;
					_init_TAB_TALK();
					break;
			}
		}

		function _init_TAB_INFO() {
			if ($state.current.name.indexOf('groupInfo') == -1) {

				var groupId = $scope.groupTabCtrl.groupId || $stateParams.groupId;
				var orgId = $stateParams.orgId;
				$scope.transitionTo('root.app.group-dashboard.groupInfo', {
					orgId: parseInt(orgId),
					groupId: parseInt(groupId)

				}, {
					REPLACE_STATE: true
				});
			}
		}

		function _init_TAB_MEMBER_LIST() {

			if ($state.current.name.indexOf('groupMembers') == -1) {

				var groupId = $scope.groupTabCtrl.groupId || $stateParams.groupId;
				var orgId = $stateParams.orgId;
				$scope.transitionTo('root.app.group-dashboard.groupMembers', {
					groupId: parseInt(groupId),
					orgId: parseInt(orgId)

				}, {
					REPLACE_STATE: true
				});
			}


		}

		function _init_TAB_GROUPS() {

			if ($state.current.name.indexOf('groupGroups') == -1) {
				var groupId = $scope.groupTabCtrl.groupId || $stateParams.groupId;
				var orgId = $stateParams.orgId;
				$scope.transitionTo('root.app.group-dashboard.groupGroups', {
					groupId: parseInt(groupId),
					orgId: parseInt(orgId)

				}, {
					REPLACE_STATE: true
				});
			}
		}

		function _init_TAB_VAULT() {


			if ($state.current.name.indexOf('groupVault') == -1) {
				var groupId = $scope.groupTabCtrl.groupId || $stateParams.groupId;
				var orgId = $stateParams.orgId;
				$scope.transitionTo('root.app.group-dashboard.groupVault', {
					groupId: parseInt(groupId),
					orgId: parseInt(orgId)

				}, {
					REPLACE_STATE: true
				});
			}

		}

		function _init_TAB_JOBS() {

			if ($state.current.name.indexOf('groupJobs') == -1) {

				var groupId = $scope.groupTabCtrl.groupId || $stateParams.groupId;
				var orgId = $stateParams.orgId;
				$scope.transitionTo('root.app.group-dashboard.groupJobs', {
					groupId: parseInt(groupId),
					orgId: parseInt(orgId)

				}, {
					REPLACE_STATE: true
				});
			}

		}

		function _init_TAB_AUDIT() {
			if ($state.current.name.indexOf('groupAudit') == -1) {

				var groupId = $scope.groupTabCtrl.groupId || $stateParams.groupId;
				var orgId = $stateParams.orgId;
				$scope.transitionTo('root.app.group-dashboard.groupAudit', {
					orgId: parseInt(orgId),
					groupId: parseInt(groupId)

				}, {
					REPLACE_STATE: true
				});
			}
		}
		
		function _init_TAB_GROUP_EVENTS() {
			if ($state.current.name.indexOf('groupEvents') == -1) {

				var groupId = $scope.groupTabCtrl.groupId || $stateParams.groupId;
				var orgId = $stateParams.orgId;
				$scope.transitionTo('root.app.group-dashboard.groupEvents', {
					orgId: parseInt(orgId),
					groupId: parseInt(groupId)

				}, {
					REPLACE_STATE: true
				});
			}
		}
		
		function _init_TAB_TEMPLATE() {
			if ($state.current.name.indexOf('groupJobTemplate') == -1) {
				var groupId = $scope.groupTabCtrl.groupId || $stateParams.groupId;
				var orgId = $stateParams.orgId;
				$scope.transitionTo('root.app.group-dashboard.groupJobTemplate', {
					orgId: parseInt(orgId),
					groupId: parseInt(groupId)
				}, {
					REPLACE_STATE: true
				});
			}
		}
		
		function _init_TAB_TALK() {
		      if ($state.current.name.indexOf('groupTalk') == -1) {
		    	  var groupId = $scope.groupTabCtrl.groupId || $stateParams.groupId;
		    	  var orgId = $stateParams.orgId;
		        $scope.transitionTo('root.app.group-dashboard.groupMeeting', {
		        	orgId: parseInt(orgId),
					groupId: parseInt(groupId)
		        }, {
		          REPLACE_STATE: true
		        });
		      }
		  }
	}

})();