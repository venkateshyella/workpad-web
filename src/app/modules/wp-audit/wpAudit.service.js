/**
 * Created by sandeep on 03/07/17.
 */
(function () {
	"use strict";

	angular.module('app.services')
	.service('WPAuditService', [
	                          '$q', 'Connect',
	                          'mDialog', '$mdToast',
	                          'blockUI', 'Lang','DataProvider','URL',
	                          'AppCoreUtilityServices','Session','CATEGORY_TYPE','$filter', '$timeout',
	                          WPAuditService
	                          ]);

	function WPAuditService($q, Connect, Dialog, $mdToast, blockUI, Lang, 
			               DataProvider, URL, AppCoreUtilityServices, Session,CATEGORY_TYPE, $filter, $timeout) {
		
		console.log("In WPAuditService")
		
		var LANG = Lang.en.data;
		
		function showWpAudit() {
			
			var deferred = $q.defer(), showWpAuditDialogOptions;
			
			showWpAuditDialogOptions = {
					controller: ['$scope', 'blockUI', '$mdDialog', wpAuditDialogController],
					templateUrl: 'app/modules/wp-audit/wp-audit-delegateAccess.partial.html',
					clickOutsideToClose:false,
					selectAllText: LANG.LABEL.SELECT_ALL,
					actionButtonText: "Update",
					cancelButtonText: "Cancel" 
			}
			
			Dialog.show(showWpAuditDialogOptions)
			.then(function (res) {
				deferred.resolve(res)
			})
			.catch(function (err) {
				deferred.reject(err);
			})
			.finally(function () {
			});
		
			return deferred.promise;

			function wpAuditDialogController($scope, blockUI, $mdDialog) {
				var _rawResponse;
				$scope.LANG = Lang.en.data;
				
				function init() {
					$scope.title = "";
					$scope.OrgData = {
							orgs: [],
							pgInfo: {
								pageSize: 25,
								currPage: 1
							}
					};
					$scope.Workspace = {
							members: [],
							pgInfo: {
								pageSize: 25,
								currPage: 1
							}
					};
					$scope.isNextPageAvailable = false;
					$scope.loadingNext = false;
					$scope.flagExpanded = false;
					$scope.fetchMoreOrgs = fetchMoreOrgs;
					$scope.isLoading = true;
					getOrgList();
					$scope.getOrgMembersList= getOrgMembersList;
				}

				$scope.close = function () {
					$mdDialog.hide();
				}
				
				$scope.submit = function(listObj,orgId){
					
					var multiSelectList = AppCoreUtilityServices.multiSelectScopeControllerFactory(listObj);
					
					var isActionInProgress = false;
					angular.extend($scope, {
						listObj: listObj,
						config: showWpAuditDialogOptions,
						cancel: function () {
							$mdDialog.hide();
						},
						multiSelectList: multiSelectList,
						action: function () {
							
							if (isActionInProgress)
								return;
							
							if (multiSelectList.getItems(true).length == 0) {
								var newTemp = $filter("filter")(multiSelectList.list, {id:$scope.adminId});
								multiSelectList.toggleItemSelection(newTemp[0]);
							}
							isActionInProgress = true;
							
							blockUI.start("Updating...");
							var _params = {
									orgId : orgId,
									userSessionId : Session.id,
							};
							
							   DataProvider.resource.WPAudit.submitDelegateAccess(multiSelectList.list,_params)
							     .then(function(res) {
							    	 blockUI.stop("Delegate Access Provided Successfully", {
											status: 'isSuccess',
											action: LANG.BUTTON.OK
										})
							    	 $mdDialog.hide(res);
							     })
							     .catch(function(error) {
							    	 $mdDialog.cancel(error)
							     })
							     .finally(function(){
							    	isActionInProgress = false;
									blockUI.stop();
							     });
						}
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

					DataProvider.resource.Organisation.getOwnedOrgList(_params).then(function (res) {
						if (res.results.length > 0) {
							$scope.loadingNext = false;
							angular.forEach(res.results, function (value, key) {
								$scope.OrgData.orgs.push(value);
							});
							$timeout();
							checkNextPgAvailability(res.paginationMetaData);
						}

					}, null, function (rawResponse) {
						_rawResponse = rawResponse;
					}).catch(function (error) {
						console.log(error);
					}).finally(function () {
						blockUI.stop();
					});
				}
				
				
				function getOrgMembersList(orgId,adminId) {
					$scope.adminId = adminId;
					$scope.flagExpanded = true;
					if ($scope.Workspace.members.length == 0) {

						blockUI.start("Loading WorkSpace Members..", {
							status: 'isLoading'
						});
					}

					var _params = {
							orgId : orgId
					};

					DataProvider.resource.WPAudit.getOrgMemberList(_params).then(function (res) {
						if (res.results.length > 0) {
							$scope.loadingNext = false;
							angular.forEach(res.results, function (value, key) {
								value.isSelected = value.auditAccess;
									$scope.Workspace.members.push(value);
							});
							$timeout();
							$scope.submit($scope.Workspace.members,_params.orgId);
							checkNextPgAvailability(res.paginationMetaData);
						}

					}, null, function (rawResponse) {
						_rawResponse = rawResponse;
					}).catch(function (error) {
						console.log(error);
					}).finally(function () {
						blockUI.stop();
					});
				}
				
				
				init();
			}
		}

	
		return {
			showWpAudit : showWpAudit
		}

	}

})();