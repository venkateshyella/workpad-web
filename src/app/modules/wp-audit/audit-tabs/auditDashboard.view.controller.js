/**
 * Created by sandeep on 03/07/17.
 */
;
(function() {
	"use strict";

	angular.module('app')
	.controller('AuditDashboardViewController', ['$scope', '$state', '$stateParams', 'blockUI', 'DataProvider', 'mDialog', '$timeout', 'Lang', 'Session', 'ROLE', '$q', AuditDashboardViewController])


	function AuditDashboardViewController($scope, $state, $stateParams, blockUI, DataProvider, Dialog, $timeout, Lang, Session, ROLE, $q) {

		var LANG = Lang.en.data;

		console.log("In AuditDashboardViewController");
		
		$scope.viewTabs = [
			"root.app.audit-dashboard.forensics",
			"root.app.audit-dashboard.productivity",
			"root.app.audit-dashboard.collaboration"
		];
		$scope.sharedData.sideMenu.currItem = 'audit';
		var orgId = $stateParams.orgId;
		
		$scope.orgTabCtrl = {
				orgId: null,
				optionMenuItems: [],
				orgModel: {}
			};
		
		$scope.xtras = {
			selectedTabIndex: 0
		};

		$scope.onTabSelect = onTabSelect;
		$scope.getOrgDetails = getOrgDetails;
		
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


		function onTabSelect(tabName) {
			switch (tabName) {
				case "TAB_FORENSICS":
					$scope.tab_curr = tabName;
					_init_TAB_FORENSICS();
					break;

				case "TAB_PRODUCTIVITY": 
					$scope.tab_curr = tabName;
					_init_TAB_PRODUCTIVITY();
					break;
				case "TAB_COLLABORATION":
					$scope.tab_curr = tabName;
					_init_TAB_COLLABORATION();
					break;
			}
		}

		function _init_TAB_PRODUCTIVITY() {
			if ($state.current.name.indexOf('productivity') == -1) {
				var orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId;
				$scope.transitionTo('root.app.audit-dashboard.productivity', {
					orgId: parseInt(orgId)
				}, {
					REPLACE_STATE: true
				});
			}
		}
		
		function _init_TAB_FORENSICS() {
			if ($state.current.name.indexOf('forensics') == -1) {
				var orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId;
				$scope.transitionTo('root.app.audit-dashboard.forensics', {
					orgId: parseInt(orgId)
				}, {
					REPLACE_STATE: true
				});
			}
		}
		
		function _init_TAB_COLLABORATION() {
			if ($state.current.name.indexOf('collaboration') == -1) {
				var orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId;
				$scope.transitionTo('root.app.audit-dashboard.collaboration', {
					orgId: parseInt(orgId)
				}, {
					REPLACE_STATE: true
				});
			}
		}
		
	};
})();