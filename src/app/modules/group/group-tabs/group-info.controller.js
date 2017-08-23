;
(function () {
	"use strict";

	angular.module('app')
		.controller('GroupInfoViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog', '$timeout', 'Lang', 'Session', 'GroupAdminService', 'State',
		                                        'AuditService', 'CATEGORY_TYPE', 'URL', GroupInfoViewController])


	function GroupInfoViewController($scope, $stateParams, blockUI, DataProvider, Dialog, $timeout, Lang, Session, GroupAdminService, State, AuditService, CATEGORY_TYPE, URL) {

		var LANG = Lang.data;
		$scope.xtras.selectedTabIndex = 0;

		var groupId = $stateParams.groupId
			, orgId = $stateParams.orgId
			, groupModel = $scope.groupTabCtrl.groupModel = DataProvider.resource.Group.get(groupId)
			, sendGroupDeleteReqFn;


		$scope.getGroupModelAndOrgModel().then(function () {
			initGroupInfoView();
		});

		function initGroupInfoView() {
			updateGroupInfoViewActions();
		}

		function groupEditClicked() {
			var group = $scope.groupTabCtrl.groupModel;
			GroupAdminService.UpdateGroup(group).then(function (result) {
				$scope.groupTabCtrl.groupModel = result.data;
				console.info(result.msg);

				Dialog.showAlert(result.msg).then(function () {
				});
			}).catch(function (error) {
				Dialog.showAlert(error.respMsg).then(function () {
				});
			});
		}

		function updateGroupInfoViewActions() {
			var groupModel = $scope.groupTabCtrl.groupModel;
			sendGroupDeleteReqFn = $scope.MU.ServiceRunner
				.buildServiceRunnerFn(function () {
					var groupId = groupModel.id;
					return DataProvider.resource.Group.destroy(groupId);
				}, {
					loadingMessage: "Deleting group",
					blockUI: true
				});
			$scope.groupTabCtrl.optionMenuItems.TAB_INFO = [];

			var infoMenuItems = [{
				name: "Edit",
				action: groupEditClicked,
				isAllowed: $scope.groupTabCtrl.groupModel.isActionAuthorized('EDIT')
			}, {
				name: "Delete",
				action: askAndDeleteGroup,
				isAllowed: $scope.groupTabCtrl.groupModel.isActionAuthorized('DELETE_GROUP')
			},{
				name: "Audit",
				action: auditClicked,
				isAllowed: true
			}];
			angular.forEach(infoMenuItems, function (menuItem) {
				if (menuItem.isAllowed) {
					$scope.groupTabCtrl.optionMenuItems.TAB_INFO.push(menuItem);
				}
			});
		}

		function askAndDeleteGroup(options) {
			var options = options || {};
			var group = $scope.groupTabCtrl.groupModel;
			var savedGroupModel = angular.copy(group);
			var message = 'Do you wish to delete "' + savedGroupModel.groupName + '" ? ';
			Dialog.showConfirm({
					title: "Delete Room",
					content: message,
					$event: options.$event,
					ok: "Ok",
					cancel: "Cancel"
				})
				.then(function () {
					blockUI.start('Deleting Group "' + group.groupName + '"');
					sendGroupDeleteReqFn()
						.then(function (groupId) {
							blockUI.stop();
							blockUI.reset();
							var deleteMessage = 'Room "' + savedGroupModel.groupName + '" was deleted successfully';
							Dialog.showAlert(deleteMessage).then(function () {
								State.transitionBack();
							});

						})
						.catch(function (error) {
							blockUI.stop(error.respMsg, {
								status: 'isError',
								action: LANG.BUTTON.OK
							})
						})
						.finally(function () {
						});

				})
				.catch(function () {
					// Do nothing!
				});
		}
		
		function auditClicked() {
			var params = {};
			params.catId = $stateParams.groupId;
			params.catType = CATEGORY_TYPE.GROUP;

			blockUI.start("Fetching Audit data");
			AuditService.checkAuditList(URL.AUDIT_LIST,params).then(function (res) {
				if (res.results.length > 0) {
					var title = "";
					blockUI.stop();

					AuditService.showAudit(URL.AUDIT_LIST,params,title, res).then(function (res) {

					}).catch(function (err) {
						Dialog.alert({
							content: err.message,
							ok: "Ok"
						});
					});
				} else{
					blockUI.stop("No Audits available", {
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
		
	}


})();
