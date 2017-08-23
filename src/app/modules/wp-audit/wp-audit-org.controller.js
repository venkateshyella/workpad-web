/**
 * Created by sandeep on 03/07/17.
 */
;
(function() {
	"use strict";

	angular.module('app')
	.controller('wpAuditOrgController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog', '$timeout', 'Lang', 'Session','$rootScope','uiGridConstants','$http','WPAuditService', wpAuditOrgController])


	function wpAuditOrgController($scope, $stateParams, blockUI, DataProvider, Dialog, $timeout, Lang, Session, $rootScope,uiGridConstants,$http,WPAuditService) {

		console.log("In wpAuditOrgController");

		$scope.LANG = Lang.data;
		$scope.sharedData.sideMenu.currItem = 'audit';
		function init() {
			$scope.OrgData = {
					orgs: [],
					pgInfo: {
						pageSize: 25,
						currPage: 1
					}
			};
			$scope.isNextPageAvailable = false;
			$scope.loadingNext = false;
			$scope.fetchMoreOrgs = fetchMoreOrgs;
			$scope.isLoading = true;
			$scope.onOrgListItemClick = onOrgListItemClick;
			$scope.delegateAccessClicked = delegateAccessClicked;
			getOrgList();
		}

		function onOrgListItemClick(org) {

			$scope.transitionTo('root.app.audit-dashboard.forensics', {
				orgId: parseInt(org.id),
				org:org
			}, {
				REPLACE_STATE: false
			});
		}


		function getOrgList() {

			if ($scope.OrgData.orgs.length == 0) {

				blockUI.start("Loading WorkSpaces..", {
					status: 'isLoading'
				});
			}

			var _params = {
					pageSize: $scope.OrgData.pgInfo.pageSize,
					pageNumber: $scope.OrgData.pgInfo.currPage,
			};

			DataProvider.resource.WPAudit.getAuditOrgList(_params).then(function (res) {
				if (res.results.length > 0) {
					$scope.loadingNext = false;
					angular.forEach(res.results, function (value, key) {
						$scope.OrgData.orgs.push(value);
					});
					$timeout();
					checkNextPgAvailability(res.paginationMetaData);
				};
			}, null, function (rawResponse) {
				_rawResponse = rawResponse;
			}).catch(function (error) {
				Dialog.alert({
					content: error.respMsg,
					ok: $scope.LANG.BUTTON.OK
				});
			}).finally(function () {
				blockUI.stop();
			});
		}

		function checkNextPgAvailability(res) {
			var totalResults = res.totalResults;
			if ($scope.OrgData.orgs.length < totalResults) {
				$scope.isNextPageAvailable = true;
			} else {
				$scope.isNextPageAvailable = false;
			}
		}

		function fetchMoreOrgs() {
			$scope.loadingNext = true;
			$scope.OrgData.pgInfo.currPage += 1;
			getOrgList();
		}
		
		
		function delegateAccessClicked() {
            WPAuditService.showWpAudit().then(function (res) {
            	console.log(res);
            })
			.catch(function (err) {
				Dialog.alert({
					content: err.respMsg,
					ok: $scope.LANG.BUTTON.OK
				});
			})
			.finally(function () {
			});
		}

		init();

	};


})();