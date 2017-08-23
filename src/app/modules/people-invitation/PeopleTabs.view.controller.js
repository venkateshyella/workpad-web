(function () {

	angular.module('app')
		.controller('PeopleTabsViewController', [
			'$scope', '$timeout', '$stateParams',
			'$controller', 'mDialog',
			'Session', 'DataProvider', 'DirectMessaging',
			'UserContactsEditWorkflow', 'UserLocationEditWorkflow', 'UserSkillEditService', 'PeopleInvitationService',
			'Lang','blockUI','$state','State',
			PeopleTabsViewController]);

	function PeopleTabsViewController($scope, $timeout, $stateParams, $controller,
	                                   Dialog, Session, DataProvider, DirectMessaging,
	                                   UserContactsEditWorkflow, UserLocationEditWorkflow, UserSkillEditService, PeopleInvitationService,
	                                   Lang, blockUI, $state, State) {
		var TAG = "PeopleTabsViewController";
		var LANG = Lang.en.data;
		var userId = $stateParams.id;
		var self = this;

		$scope.isContextMenuRequired = false;
		
		//$scope.sharedData.sideMenu.currItem = 'account';
		
		$scope.data = {};
		$scope.xtras = {
			isAdmin: false
		};
		$scope.userId = userId;
		$scope.title = "People";
		$scope.viewModel = {
			status: "NOT_READY"
		};

		$scope.LANG_USER = LANG.USER_PROFILE;

		$scope.tabs = {
			TAB_SEARCH: {
				//src: "app/modules/user/profile/tab-userProfile.html"
				//allowedActions: ['EDIT_PROFILE', 'DIRECT_MESSAGE','VIEW_MESSAGE']
			},
			TAB_TAG: {
				//src: "app/modules/user/profile/tab-contact.html"
				//allowedActions: ['EDIT_CONTACTS', 'ADD_PHONE_NUM', 'ADD_EMAIL']
			},
			TAB_INVITES: {
				//src: "app/modules/user/profile/tab-skill.html",
				allowedActions: ['INVITE_STATUS']
			}
		};

		$scope.ui = {
			profileTab: {
				currTab: 'info'
			}
		};

		$scope.tab_default = "TAB_SEARCH";
		$scope.tab_curr = $scope.tab_default;
		
		function _init(){
			onTabSelect($scope.tab_default);
		}

		_init();
		
		angular.extend($scope, {
			refreshScope: refreshScope,
			onTabSelect: onTabSelect,
			onInviteStatusClick: onInviteStatusClick
			
		});
		

		function run() {
			if (angular.isDefined(userId)) {
				angular.extend(self, $controller('ViewDataBaseController', {$scope: $scope}));
				self.viewData = {
					people: self.initializeViewDataBaseController('people', refreshData, getData)
				};

				refreshScope({bypassCache: true});
			} else {
				// invalid view parameters.
			}
		}
		
		function onTabSelect(index) {
			"use strict";
			if ("TAB_INVITES" == index) {
				$scope.isContextMenuRequired = true;
			}else{
				$scope.isContextMenuRequired = false;
			} 
			
			redirectToTabView(index);
			
			$scope.tab_curr = index;
		}
//		$scope.invitePeople = function(){
//			PeopleInvitationService.invitePeople().then(function (data) {
//				angular.extend(self, $controller('PeopleInvitesViewController', {$scope: $scope}));
//				//self.refreshPeopleInvitesView();
//				
//		       $state.reload();
//		       $scope.resetTransitionTo('root.app.people.invites');
//			}, function (error) {
//				$state.transitionTo('root.app.people.invites', {}, {
//					REPLACE_STATE: true
//				});
//			});   
//			
//        };
        
        
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

		function onInviteStatusClick() {
			
			
		}
		
		function redirectToTabView(index){
			"use strict";
			switch (index) {
				case 'TAB_SEARCH':
				default:
					_init_TAB_PEOPLE_SEARCH(); 
					break;

				case 'TAB_TAG':
					_init_TAB_PEOPLE_TAG();
					break;

				case 'TAB_INVITES':
					_init_TAB_PEOPLE_INVITES();
					break;

			}
		}
		
		
		function _init_TAB_PEOPLE_SEARCH() {

			if ($state.current.name.indexOf('people.search') == -1) {

				$scope.transitionTo('root.app.people.search', {}, {
					REPLACE_STATE: true
				});
			}

		}
		
		function _init_TAB_PEOPLE_TAG() {

			if ($state.current.name.indexOf('people.tag') == -1) {

				$scope.transitionTo('root.app.people.tag', {}, {
					REPLACE_STATE: true
				});
			}

		}
		
		function _init_TAB_PEOPLE_INVITES() {

			if ($state.current.name.indexOf('people.invites') == -1) {

				$scope.transitionTo('root.app.people.invites', {}, {
					REPLACE_STATE: true
				});
			}

		}

		

		run();
	}

})();
