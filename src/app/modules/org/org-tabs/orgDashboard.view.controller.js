;
(function () {
	"use strict";

	angular.module('app')


		.controller('OrgDashboardViewController', ['$scope', '$state', '$stateParams', 'blockUI', 'DataProvider', 'mDialog', '$timeout', 'Lang', 'Session', 'ROLE', '$q', OrgDashboardViewController])


	function OrgDashboardViewController($scope, $state, $stateParams, blockUI, DataProvider, Dialog, $timeout, Lang, Session, ROLE, $q) {

		console.log("In Org dashboard controller");

		var LANG = Lang.en.data;

		$scope.viewTabs = [
			"root.app.org-dashboard.orgInfo",
			"root.app.org-dashboard.orgMembers",
			"root.app.org-dashboard.orgGroups",
			"root.app.org-dashboard.orgChat",
			"root.app.org-dashboard.orgVault",
			"root.app.org-dashboard.orgJobs",
			"root.app.org-dashboard.orgAudit",
			//"root.app.org-dashboard.orgEvents"
			"root.app.org-dashboard.orgSchedule",
			"root.app.org-dashboard.orgTalk"
		];
		$scope.xtras = {
			// selectedTabIndex: _.find($scope.viewTabs, function(stateName) {
			//     return stateName == $state.$current.name
			// })
			selectedTabIndex: 0
		};

		$scope.orgTabCtrl = {
			orgId: null,
			optionMenuItems: [],
			orgModel: {}
		};

		$scope.ui = {
			flags: {
				isSendingMessage: false,
				isInARoom: false,
			    sendMessage_inProgress: false
			}
		};

		$scope.onTabSelect = onTabSelect;


		var orgId = $stateParams.orgId;

		$scope.getOrgDetails = getOrgDetails;
		$scope.checkIfUserIsOrgVisitor = checkIfUserIsOrgVisitor;

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
						$scope.orgTabCtrl.orgModel = org;
						$scope.OrgChatroomNickName = 'U' + Session.userId + '-J' + $scope.orgTabCtrl.orgModel.id;

						deferred.resolve(org);

					}).catch(function (error) {
					deferred.reject();
					console.log(error);
				}).finally(function () {
					blockUI.stop();
				});
			}
			return deferred.promise;

		}

		function checkIfUserIsOrgVisitor(currentRole) {
			$scope.orgTabCtrl.isOrgVisitor = (currentRole == ROLE.ORG_VISITOR);
		}

		function onTabSelect(tabName) {
			switch (tabName) {
				case "TAB_AUDIT":
					$scope.tab_curr = tabName;
					_init_TAB_AUDIT();
					break;

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
					$scope.xtras.selectedTabIndex = 3;
					$scope.tab_curr = tabName;
					$scope.transitionTo('root.app.org-dashboard.orgChat', {
						orgId: parseInt($stateParams.orgId)
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
				case "TAB_SCHEDULE":
					$scope.tab_curr = tabName;
					_init_TAB_SCHEDULE();
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

		function _init_TAB_AUDIT() {
			if ($state.current.name.indexOf('orgAudit') == -1) {
				var orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId;
				$scope.transitionTo('root.app.org-dashboard.orgAudit', {
					orgId: parseInt(orgId)
				}, {
					REPLACE_STATE: true
				});
			}
		}

		function _init_TAB_INFO() {

			if ($state.current.name.indexOf('orgInfo') == -1) {

				var orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId;
				$scope.transitionTo('root.app.org-dashboard.orgInfo', {
					orgId: parseInt(orgId)

				}, {
					REPLACE_STATE: true
				});
			}


		}

		function _init_TAB_MEMBER_LIST() {

			if ($state.current.name.indexOf('orgMembers') == -1) {

				var orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId;
				$scope.transitionTo('root.app.org-dashboard.orgMembers', {
					orgId: parseInt(orgId)

				}, {
					REPLACE_STATE: true
				});
			}


		}

		function _init_TAB_GROUPS() {

			if ($state.current.name.indexOf('orgGroups') == -1) {
				var orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId;
				$scope.xtras.selectedTabIndex = 2;
				$scope.transitionTo('root.app.org-dashboard.orgGroups', {
					orgId: parseInt(orgId)

				}, {
					REPLACE_STATE: true
				});
			}
		}

		function _init_TAB_VAULT() {


			if ($state.current.name.indexOf('orgVault') == -1) {
				var orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId;
				$scope.transitionTo('root.app.org-dashboard.orgVault', {
					orgId: parseInt(orgId)

				}, {
					REPLACE_STATE: true
				});
			}


		}

		function _init_TAB_JOBS() {

			if ($state.current.name.indexOf('orgJobs') == -1) {

				var orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId;
				$scope.transitionTo('root.app.org-dashboard.orgJobs', {
					orgId: parseInt(orgId)

				}, {
					REPLACE_STATE: true
				});
			}

		}

		function _init_TAB_ANALYSIS() {

			if ($state.current.name.indexOf('orgAnalysis') == -1) {
				var orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId;
				$scope.transitionTo('root.app.org-dashboard.orgAnalysis', {
					orgId: parseInt(orgId)
				}, {
					REPLACE_STATE: true
				});
			}


		}
		
		function _init_TAB_SCHEDULE() {
		      if ($state.current.name.indexOf('orgSchedule') == -1) {
		        var orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId;
		        $scope.transitionTo('root.app.org-dashboard.orgSchedule', {
		          orgId: parseInt(orgId)
		        }, {
		          REPLACE_STATE: true
		        });
		      }
		  }
		
		function _init_TAB_TEMPLATE() {
		      if ($state.current.name.indexOf('orgJobTemplate') == -1) {
		        var orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId;
		        $scope.transitionTo('root.app.org-dashboard.orgJobTemplate', {
		          orgId: parseInt(orgId)
		        }, {
		          REPLACE_STATE: true
		        });
		      }
		  }
		
		function _init_TAB_TALK() {
		      if ($state.current.name.indexOf('orgTalk') == -1) {
		        var orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId;
		        $scope.transitionTo('root.app.org-dashboard.orgMeeting', {
		          orgId: parseInt(orgId)
		        }, {
		          REPLACE_STATE: true
		        });
		      }
		  }
	}


})();