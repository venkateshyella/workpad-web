(function () {

	angular.module('app')
		.controller('UserProfileViewController', [
			'$scope', '$timeout', '$stateParams',
			'$controller', 'mDialog',
			'Session', 'DataProvider', 'DirectMessaging',
			'UserContactsEditWorkflow', 'UserLocationEditWorkflow', 'UserSkillEditService',
			'Lang','blockUI','$state',
			UserProfileViewController]);

	function UserProfileViewController($scope, $timeout, $stateParams, $controller,
	                                   Dialog, Session, DataProvider, DirectMessaging,
	                                   UserContactsEditWorkflow, UserLocationEditWorkflow, UserSkillEditService,
	                                   Lang, blockUI, $state) {
		var TAG = "UserViewController";
		var LANG = Lang.en.data;
		var userId = $stateParams.id;

		$scope.isContextMenuRequired = true;
		
		//$scope.sharedData.sideMenu.currItem = 'account';
		
		$scope.data = {};
		$scope.xtras = {
			isAdmin: false
		};
		$scope.sharedData.sideMenu.currItem = '';
		$scope.userId = userId;
		$scope.title = "Profile";
		$scope.viewModel = {
			status: "NOT_READY"
		};

		$scope.LANG_USER = LANG.USER_PROFILE;

		$scope.tabs = {
			TAB_PROFILE: {
				src: "app/modules/user/profile/tab-userProfile.html",
				allowedActions: ['EDIT_PROFILE', 'DIRECT_MESSAGE','VIEW_MESSAGE']
			},
			TAB_CONTACT: {
				src: "app/modules/user/profile/tab-contact.html",
				allowedActions: ['EDIT_CONTACTS', 'ADD_PHONE_NUM', 'ADD_EMAIL']
			},
			TAB_SKILL: {
				src: "app/modules/user/profile/tab-skill.html",
				allowedActions: ['ADD_SKILL', 'REMOVE_SKILL']
			},
			TAB_LOCATION: {
				src: "app/modules/user/profile/tab-location.html",
				allowedActions: ['EDIT_LOCATION', 'ADD_LOCATION']
			}
		};

		$scope.ui = {
			profileTab: {
				currTab: 'info'
			}
		};

		$scope.tab_default = "TAB_PROFILE";
		$scope.tab_curr = $scope.tab_default;

		angular.extend($scope, {
			refreshScope: refreshScope,
			onTabSelect: onTabSelect,
			onEditClick: onEditClick,
			onEditImageClick: onEditClick,
			runAddEmailWorkflow: runAddEmailWorkflow,
			runRemoveEmailWorkflow: runRemoveEmailWorkflow,
			runAddPhoneNumWorkflow: runAddPhoneNumWorkflow,
			runRemovePhoneNumWorkflow: runRemovePhoneNumWorkflow,
			runNewLocationWorkflow: runNewLocationWorkflow,
			runRemoveLocationsWorkflow: runRemoveLocationsWorkflow,
			changePasswordNew:changePasswordNew,
			mySubScriptions:mySubScriptions
		});
		
		function changePasswordNew() {
			"use strict";
			Dialog.show({
				scope:$scope,  
				preserveScope: true,
				parent: angular.element(document.body),
				templateUrl: 'app/modules/user/change-password/change-password.partial.html',
				controller: 'ChangePasswordViewController',
				clickOutsideToClose:false
			});
		}
		
		function mySubScriptions() {
			$scope.transitionTo('root.app.subscribedOrgs', {
	        }, {
	            REPLACE_STATE: false
	        });
		}

		$scope.onRemoveSkillClick = onRemoveSkillClick;
		$scope.onAddSkillClick = onAddSkillClick;
		$scope.newDirectMessage = newDirectMessage;
		$scope.directMessages = directMessages;

		function newDirectMessage() {
			"use strict";
			// Create new topic with that user.
			DirectMessaging.runSendMessageWorkflow(null, userId);
		}
		
		function directMessages() {
			"use strict";
			blockUI.start("Loading...");
			DirectMessaging.loadPingTopicsList().then(function (res) {
				if (res.resp.results.length > 0) {
					blockUI.stop();
					DirectMessaging.sendMessagesViewWorkflow();
				} else{
					blockUI.stop("No Pings available", {
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

		function onRemoveSkillClick() {
			var user = DataProvider.resource.User.get(userId);

			if (user.skills == "" || user.skills.length == 0) {
				return Dialog.alert({
					title: LANG.USER_EDIT.CONTACTS.REMOVE_SKILLS,
					content: LANG.USER_EDIT.MESSAGE.NO_SKILL_AVAILABLE,
					ok: LANG.BUTTON.OK
				});
			}
			UserSkillEditService.showRemoveSkillDialog($stateParams.id);
		}

		function onAddSkillClick() {
			UserSkillEditService.showAddSkillDialog($stateParams.id);
		}

		function run() {
			if (angular.isDefined(userId)) {
				angular.extend(self, $controller('ViewDataBaseController', {$scope: $scope}));
				self.viewData = {
					profile: self.initializeViewDataBaseController('profile', refreshData, getData)
				};

				refreshScope({bypassCache: true});
			} else {
				// invalid view parameters.
			}
		}

		function onTabSelect(index) {
			"use strict";
			if ($scope.data.user && $scope.data.user.id != $scope.session.userId && "TAB_PROFILE" != index) {
					$scope.isContextMenuRequired = false;
			} else {
				$scope.isContextMenuRequired = true;
			}
			
			$scope.tab_curr = index;
		}

		function refreshData(options) {
			var userId = $stateParams.id;
			if (userId) {
				return DataProvider.resource.User.find(userId, {
					bypassCache: true
				});
			} else {
				return null;
			}
		}

		function getData(options) {
			"use strict";
			var userId = $stateParams.id;
			return DataProvider.resource.User.get(userId);
		}

		function refreshScope(options) {
			var options = options || {};
			var userId = $stateParams.id;
			if (!userId) {
				$scope.viewModel.status = 'IS_MISSING';
				return;
			}

			return $scope.profile.refresh(options)
				.then(function (res) {
					"use strict";
					DataProvider.resource.User.get(userId).refreshImageHash();
					$scope.data.user = self.viewData.profile.profile.data;
					$scope._state = self.viewData.profile.profile.state;
					$scope.xtras.isAdmin = ($scope.data.user.id == $scope.session.userId);
				})
				.catch(function (err) {
					"use strict";
					//Dialog.alert(err.respMsg);
				});
		}

		function onEditClick() {
			"use strict";
			switch ($scope.tab_curr) {
				case 'TAB_PROFILE':
				default:
					$scope.transitionTo('root.app.user-edit.profile', {id: $scope.userId});
					break;

				case 'TAB_CONTACT':
					$scope.transitionTo('root.app.user-edit.contacts', {id: $scope.userId});
					break;

				case 'TAB_SKILL':
					break;

				case 'TAB_LOCATION':
					break;
			}
		}

		function runUserImageEditWorkflow() {
			"use strict";

		}

		function runAddEmailWorkflow() {
			"use strict";
			var addEmailWorkflowRunner = UserContactsEditWorkflow.runAddEmailWorkflow();
			addEmailWorkflowRunner.startWorkflow($scope.data.user.id);

		}

		function runRemoveEmailWorkflow() {
			"use strict";
			var workflowRunner = UserContactsEditWorkflow.RemoveEmailNumberWorkflowRunner();
			workflowRunner.startWorkflow($scope.data.user.id);
		}

		function runAddPhoneNumWorkflow() {
			"use strict";
			var addPhoneNumWorkflowRunner = UserContactsEditWorkflow.AddPhoneNumberWorkflowRunner();

			addPhoneNumWorkflowRunner.startWorkflow($scope.data.user.id);

		}

		function runRemovePhoneNumWorkflow() {
			"use strict";
			var workflowRunner = UserContactsEditWorkflow.RemovePhoneNumberWorkflowRunner();
			workflowRunner.startWorkflow($scope.data.user.id);

		}

		function runNewLocationWorkflow() {
			"use strict";
			var addLocationRunner = UserLocationEditWorkflow.addNewLocationToProfileWorkflowRunner();

			addLocationRunner.startWorkflow($scope.data.user.id);
		}

		function runRemoveLocationsWorkflow() {
			"use strict";
			var locationRemover = UserLocationEditWorkflow.deleteLocationsFromProfileWorkflowRunner();
			locationRemover.startWorkflow($scope.data.user.id);
		}

		run();
	}

})();
