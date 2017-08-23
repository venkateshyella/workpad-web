/**
 * Created by sudhir on 24/6/15.
 */


;
(function () {
	"use strict";

	angular.module('app')
		.controller('GroupDetailViewController', [
			'$scope', '$controller', '$timeout', '$interval',
			'$stateParams', 'State', 'DataProvider',
			'$q', 'Connect', 'URL',
			'UserSelector', 'UserInvitationService',
			'CreateGroupService', 'VaultServices',
			'VaultFilesWorkflow', 'VaultFileRename',
			'FileSystem', 'FileService',
			'StropheService',
			'ChatterService', 'ChatterConnect',
			'mDialog', 'blockUI',
			'ROLE', 'CATEGORY_TYPE', 'Lang',
			GroupDetailViewController
		]);

	function GroupDetailViewController($scope, $controller, $timeout, $interval, $stateParams
		, State, DataProvider, $q
		, Connect, URL
		, UserSelector, UserInvitationService
		, CreateGroupService
		, VaultServices, VaultFilesWorkflow, VaultFileRename
		, FileSystem, FileService
		, ChatService, ChatterService, ChatterConnect
		, Dialog, blockUI, ROLE, CATEGORY_TYPE, Lang) {

		var self = this;
		var LANG = Lang.en.data
			, TAG_GROUP_FILE_UPLOAD = "tag_group_file_upload"
			, groupId = $stateParams.groupId
			, orgID = $stateParams.orgId
			, group = null
			;

		$scope.viewTabs = {
			TAB_INFO: {
				allowedActions: [
					"DELETE_GROUP",
					"EDIT"
				]
			},
			TAB_CHAT: {
				allowedActions: [
					"REFRESH"
				]
			},
			TAB_GROUPS: {
				allowedActions: [
					//"REFRESH",
					"CREATE_SUB_GROUP"
				]
			},
			TAB_MEMBERS: {
				allowedActions: [
					//"REFRESH",
					"INVITE_USER"
				]
			},
			TAB_GROUP_VAULT: {
				allowedActions: [
					//"REFRESH",
					"ADD_NEW_FILE", "REMOVE_FILE", "RENAME_FILE", "COPY_FILE"
				]
			}
		};

		angular.extend(self, $controller('ViewBaseController', {
			$scope: $scope
		}));
		angular.extend(self, $controller('ViewDataBaseController', {
			$scope: $scope
		}));

		self.viewData = {
			org: self.initializeViewDataBaseController('orgDetails', fetchOrgDetails, findOrgDetails, {
				loadingMessage: LANG.GROUP.DEFAULTS.DETAILS_LOADING_MESSAGE
			}),
			group: self.initializeViewDataBaseController('grpDetails', fetchGrpDetails, findGrpDetails, {
				loadingMessage: LANG.GROUP.DEFAULTS.DETAILS_LOADING_MESSAGE
			}),
			subGroups: self.initializeViewDataBaseController('grpSubGroups', fetchGrpSubGroups),
			members: self.initializeViewDataBaseController('grpMembers', fetchGrpMembers),
			groupVaultFiles: self.initializeViewDataBaseController('groupVaultFiles', fetchGroupVaultFiles)
		};

		$scope.data = {
			org: DataProvider.resource.Organisation.get($stateParams.orgId) || {},
			group: DataProvider.resource.Group.get($stateParams.groupId) || {},
			groupVaultFiles: {}
		};
		self.tabs = ['TAB_INFO', 'TAB_MEMBERS', 'TAB_GROUPS', 'TAB_CHAT', 'TAB_GROUP_VAULT'];

		$scope.enableActions = true;
		$scope.tabs = {
			TAB_INFO: {},
			TAB_GROUPS: {},
			TAB_MEMBERS: {}
		};
		$scope.tab_default = "TAB_INFO";
		$scope.tab_curr = $scope.tab_default;
		$scope.xtras = {
			isNavigateDone: false
		};
		$scope.LANG = LANG;

		angular.extend($scope, {
			refresh: refresh,
			confirmAndDeleteGroup: confirmAndDeleteGroup,
			findThenInviteUser: findThenInviteUser,
			createSubGroup: createSubGroup,
			askAndRemoveGroupMember: askAndRemoveGroupMember,
			showGroupMemberOptions: showGroupMemberOptions,
			onGroupMemberListItemClick: onGroupMemberListItemClick,
			onTabSelect: onTabSelect,
			invokeFileChooser: invokeFileChooser,
			onGroupVaultFileItemClick_primary: onGroupVaultFileItemClick_primary,
			onGroupVaultFileItemClick_secondary: onGroupVaultFileItemClick_secondary,
			onGroupVaultFileItem_hold: onGroupVaultFileItem_hold,
			viewFile: viewFile,
			askAndDeleteFile: askAndDeleteFile,
			findAndRemoveVaultFiles: findAndRemoveVaultFiles,
			findAndRenameVaultFiles: findAndRenameVaultFiles,
			findAndCopyVaultFiles: findAndCopyVaultFiles,
			findAndDownloadVaultFiles: findAndDownloadVaultFiles
		});

		function findAndRemoveVaultFiles() {
			blockUI.start(LANG.GROUP.LOADING_MSG.FETCHING_OWNER_FILES);
			fetchVaultFilesWithAdminRights()
				.then(function (files) {
					if (files && files.length > 0) {
						blockUI.stop();
						VaultFilesWorkflow.selectAndExecuteActionOnFiles(files,
							function (fileList) {
								var deferred = $q.defer();
								blockUI.start(LANG.VAULT.LOADING_MSG.DELETING_FILES);
								group.deleteFiles(fileList)
									.then(function (res) {
										blockUI.stop();
										deferred.resolve(res);
									})
									.catch(function (err) {
										var errMsg = err && err.respMsg || LANG.ERROR.DEFAULT
										blockUI.stop(errMsg, {
											status: 'isError',
											action: LANG.BUTTON.OK
										});
										deferred.reject(err);
									})
									.finally(function () {
										blockUI.stop();
									})
								;
								return deferred.promise;
							},
							{
								title: "Delete Files",
								actionButtonText: LANG.BUTTON.DELETE,
								cancelButtonText: LANG.BUTTON.CANCEL
							});
					}
					else {
						blockUI.stop("No Files available", {
							status: 'isSuccess',
							action: LANG.BUTTON.OK
						})
					}
				})
				.catch(function (err) {
					var errMsg = (err && err.respMsg) || "";
					blockUI.stop(errMsg);
					Dialog.alert(err.errMsg);
				})
		}

		function findAndRenameVaultFiles() {
			blockUI.start(LANG.GROUP.LOADING_MSG.FETCHING_OWNER_FILES);
			fetchVaultFilesWithAdminRights()
				.then(function (files) {
					if (files && files.length > 0) {
						blockUI.stop();
						VaultFileRename.renameFiles(files,
							function (updatedFiles) {
								var deferred = $q.defer();
								blockUI.start(LANG.VAULT.LOADING_MSG.RENAME_FILES);
								group.updateFiles(
									DataProvider.pluckAttrArrayProperties(updatedFiles, ['id', 'fileDisplayName']),
									{
										url: URL.VAULT_FILE_RENAME
									})
									.then(function (res) {
										blockUI.stop();
										deferred.resolve(res);
									})
									.catch(function (err) {
										var errMsg = err && err.respMsg || LANG.ERROR.DEFAULT;
										blockUI.stop(errMsg, {
											status: 'isError',
											action: LANG.BUTTON.OK
										});
										deferred.reject(err);
									})
									.finally(function () {
										blockUI.stop();
									})
								;

								return deferred.promise;
							},
							{
								title: LANG.VAULT.LABEL.TITLE_RENAME_FILES,
								newFileNamePlaceHolder: LANG.VAULT.LABEL.PLACEHOLDER_NEW_FILE_NAME,
								actionButtonText: LANG.VAULT.BUTTON.RENAME,
								cancelButtonText: LANG.BUTTON.CANCEL
							})
					}
					else {
						blockUI.stop("No Files available", {
							status: 'isSuccess',
							action: LANG.BUTTON.OK
						})
					}
				})
				.catch(function (err) {
					var errMsg = (err && err.respMsg) || "";
					blockUI.stop(errMsg);
					Dialog.alert(err.errMsg);
				})
		}

		function findAndCopyVaultFiles() {
			var deferred = $q.defer();
			blockUI.start(LANG.GROUP.LOADING_MSG.FETCHING_OWNER_FILES);
			group.loadFiles({sendToAll: true})
				.then(function (vaultFiles) {
					if (vaultFiles && vaultFiles.length > 0) {
						blockUI.stop();
						VaultFilesWorkflow.selectAndCopyFiles(vaultFiles,
							function (selectedFiles, copyDestination) {
								var src =
								{
									catId: group.id,
									catType: CATEGORY_TYPE.GROUP
								}, dst =
								{
									catType: copyDestination.catType,
									catId: copyDestination.id
								};
								blockUI.start('Copying files');
								return VaultServices.copyFiles(selectedFiles, src, dst, {
										url: URL.VAULT_FILE_COPY
									})
									.then(function (res) {
										blockUI.stop();
										return res;
									})
									;
							},
							_fetchCopyDestinationList,
							{
								title: LANG.VAULT.LABEL.TITLE_COPY_FILES,
								actionButtonText: LANG.VAULT.BUTTON.COPY,
								cancelButtonText: LANG.BUTTON.CANCEL,
								placeholder_select_destination: LANG.VAULT.LABEL.PLACEHOLDER_SELECT_DESTINATION_VAULT
							});
					} else {
						blockUI.stop("No Files available", {
							status: 'isSuccess',
							action: LANG.BUTTON.OK
						})
					}
				})
				.catch(function (err) {
					var errMsg = (err && err.respMsg) || LANG.ERROR.DEFAULT;
					blockUI.stop(errMsg, {
						status: 'isError',
						action: LANG.BUTTON.OK
					});
				})
				.finally(function () {
				})
			;
			return deferred.promise;
		}

		function findAndDownloadVaultFiles() {
			blockUI.start(LANG.GROUP.LOADING_MSG.FETCHING_OWNER_FILES);
			fetchVaultFilesWithAdminRights()
				.then(function (vaultFiles) {
					if (vaultFiles && vaultFiles.length > 0) {
						blockUI.stop();
						VaultFilesWorkflow.selectAndExecuteActionOnFiles(vaultFiles,
							function (fileList) {
								return VaultServices.downloadFiles(fileList)
									.then(function (res) {
										return res;
									})
									.catch(function (err) {
										return err;
									})
									;
							},
							{
								title: LANG.VAULT.LABEL.TITLE_DOWNLOAD_FILES,
								actionButtonText: LANG.VAULT.BUTTON.DOWNLOAD,
								cancelButtonText: LANG.BUTTON.CANCEL
							});
					}
					else {
						blockUI.stop("No Files available", {
							status: 'isSuccess',
							action: LANG.BUTTON.OK
						})
					}
				})
		}

		function _fetchCopyDestinationList() {
			return group.fetchVaultFileCopyDestinations()
				.then(function (res) {
					return VaultServices.prepCopyDestinationResults(res);
				})
				.catch(function (err) {
					return err;
				})
		}

		function fetchVaultFilesWithAdminRights() {
			var orgId = $stateParams.orgId
				, groupId = group.id
				;
			return DataProvider.resource.File.findAll({
				groupId: groupId
			}, {
				url: URL.GROUP_VAULT_OWNER_FILE_LIST,
				bypassCache: true
			});
		}

		function initScope() {
			$scope.MU.renewImgHash();
			$scope.xtras.title = $scope.data.group.groupName || LANG.GROUP.DEFAULTS.DETAILS_TITLE;
			$scope.xtras.subTitle = $scope.data.org.orgName;
			$scope.xtras.flag = {
				isAdmin: $scope.data.group.adminId == $scope.session.userId,

				// Allow user to create new groups.
				isAllowed_create_sub_group: ($scope.data.group.role == ROLE.GROUP_MEMBER) || ($scope.data.group.role == ROLE.GROUP_ADMIN),

				// Allow user to add new file to the organisation data vault.
				isAllowed_add_file: ($scope.data.group.role == ROLE.GROUP_MEMBER) || ($scope.data.group.role == ROLE.GROUP_ADMIN),

				// Allow user to invite new users to the group
				isAllowed_invite_user: $scope.data.group.role == ROLE.GROUP_ADMIN,

				isChatCredentialsAvailable: false,

				isChatEnabled: false,

				isVaultDisabled: false
			};

			if (($scope.data.group.role == ROLE.GROUP_ADMIN) || ($scope.data.group.role == ROLE.GROUP_MEMBER)) {
				$scope.xtras.flag.isVaultDisabled = false;
			} else {
				$scope.xtras.flag.isVaultDisabled = true;
			}

			$scope.xtras.flag.isChatEnabled = true;

			if ($scope.data.group.chatRoomId) {
				$scope.xtras.flag.isChatCredentialsAvailable = true;
			} else {
				$scope.xtras.flag.isChatCredentialsAvailable = false;
			}


		}

		function onTabSelect(tabName, options) {
			switch (tabName) {
				case 'TAB_INFO':
					// if current user is the admin of the group, enable edit option
					$scope.tab_curr = 'TAB_INFO';
					if ($scope.data.group &&
						$scope.data.group.role == 'GROUP_ADMIN') {
					} else {
					}

					$scope.orgDetails.refresh()
						.then(function () {
							$scope.data.org = self.viewData.org.orgDetails.data;
						});

					$scope.data.group = findGrpDetails();
					$scope.grpDetails.refresh({
							params: {
								orgId: $stateParams.orgId,
								grpId: $stateParams.groupId
							},
							//bypassCache: true
						})
						.then(function () {
							$scope.data.group = self.viewData.group.grpDetails.data;
							initScope();
							chat_nickName = getGroupChatNickName();

							$scope.xtras.flag.isChatEnabled = true;

							// $scope.xtras.flag.isVaultDisabled = true;

							if (($scope.data.group.role == ROLE.GROUP_ADMIN) || ($scope.data.group.role == ROLE.GROUP_MEMBER)) {
								$scope.xtras.flag.isVaultDisabled = false;
							} else {
								$scope.xtras.flag.isVaultDisabled = true;
							}


							if ($scope.data.group.chatRoomId) {
								$scope.xtras.flag.isChatCredentialsAvailable = true;
							} else {
								$scope.xtras.flag.isChatCredentialsAvailable = false;
							}

							if (!$scope.xtras.isNavigateDone) {
								_runTabNavigation();
								$scope.xtras.isNavigateDone = true;
							}

							function _runTabNavigation() {
								/*
								 BE WARNED: VERY DIRTY CODE
								 */
								var targetTabIndex = self.tabs.indexOf($stateParams.tab) >= 0
									? self.tabs.indexOf($stateParams.tab)
									: 0;
								switch ($stateParams.tab) {
									case 'TAB_CHAT':
										if ($scope.xtras.flag.isChatEnabled && $scope.xtras.flag.isChatCredentialsAvailable) {
											$scope.xtras.curr_tab_index = targetTabIndex
										}
										break;
									case 'TAB_VAULT':
										if ($scope.xtras.flag.isChatEnabled) {
											$scope.xtras.curr_tab_index = targetTabIndex
										}
										break;
									default:
										$scope.xtras.curr_tab_index = targetTabIndex
								}
							}
						});
					//toggleAddMemberOption(false);
					break;

				case 'TAB_GROUPS':
					$scope.tab_curr = 'TAB_GROUPS';
					var subGroups = $scope.data.group.groups;

					angular.forEach(subGroups, function (group) {
						group.id = group.groupId
					});
					injectGroups(subGroups);
					$scope.data.subGroups = DataProvider.resource.Group.getAll(_.pluck(subGroups, 'id'));
					// fetch sub-groups list
					$scope.grpSubGroups.refresh({
							bypassCache: true
						})
						.then(function (result) {
							$scope.data.subGroups = self.viewData.subGroups.grpSubGroups.data;
						}, function (error) {
							console.info(error)
						});
					initScope();

					break;

				case 'TAB_MEMBERS':
					$scope.tab_curr = 'TAB_MEMBERS';
					//var groupMembers = $scope.data.group.members;
					//injectGroupMembers(groupMembers);
					//var memberArray = _.pluck(groupMembers, 'id');
					//$scope.data.groupMembers = DataProvider.resource.User.getAll(memberArray);
					$scope.grpMembers.refresh({
							bypassCache: true
						})
						.then(function (users) {
							$scope.data.groupMembers = self.viewData.members.grpMembers.data;
						})
						.catch(function (error) {
							console.log(error);
						});

					initScope();

					break;

				case 'TAB_GROUP_VAULT':
					$scope.tab_curr = 'TAB_GROUP_VAULT';

					$scope.isFetching_groupVaultFiles = true;
					$scope.groupVaultFiles.refresh()
						.then(function (res) {
							$scope.data.groupVaultFiles = self.viewData.groupVaultFiles.groupVaultFiles.data;
						})
						.catch(function (err) {
							console.log(err);
						})
						.finally(function () {
							$scope.isFetching_groupVaultFiles = false;
						});

					break;

				case 'TAB_CHAT':
					$scope.tab_curr = 'TAB_CHAT';
					initializeGroupChatClient();
					break;

				default:
			}
		}

		function injectGroups(groups) {
			angular.forEach(groups, function (group) {
				if (!DataProvider.resource.Group.get(group.id)) {
					DataProvider.resource.Group.inject(group);
				}
			})
		}

		function injectGroupMembers(users) {
			angular.forEach(users, function (groupMember) {
				if (!DataProvider.resource.User.get(groupMember.id)) {
					DataProvider.resource.User.inject(groupMember);
				}
				DataProvider.resource.User.get(groupMember.id).refreshImageHash();
			});
		}

		function refresh(options) {
			onTabSelect($scope.tab_curr, options);
		}

		function askAndRemoveGroupMember(user, group) {
			return Dialog.confirm({
				title: "Remove User",
				content: 'Do you wish to remove ' + user.userFirstName + ' ' + user.userLastName + ' from this room?',
				ok: "Remove",
				cancel: "Cancel"
			}).then(function (res) {
				var intent = {
					org: $scope.data.org,
					group: $scope.data.group
				};
				UserInvitationService.ejectUserFromGroup(user, intent).then(function (resp) {
					Dialog.alert(resp.respMsg);
					refresh({
						bypassCache: true
					})
				}).catch(function (error) {
					Dialog.alert(error.respMsg)
				})
			})
		}

		function findThenInviteUser(org, group, options) {
			options = options || {};
			options.autoClose = false;
			UserSelector.showUserSelect({
					loadUsers: queryOrgMembers
				}, options)
				.then(null, null, function (bundle) {
					var user = bundle.selection;
					var userSelectCtrl = bundle.ctrl;

					var targetBundle = {
						toGroup: group,
						toOrg: org,
						org: org
					};
					UserInvitationService.showPrepareInvitationDialog(user, targetBundle, options)
						.then(function (res) {
							console.log(res);
							userSelectCtrl.cancel();
						})
						.finally(function () {
							$scope.enableActions = true;
						})

				});
			//UserInvitationService.showPrepareInvitationDialog({
			//  toOrg: {},
			//  toGroup: {}
			//})
		}

		function queryOrgMembers(bundle) {
			var query = bundle.queryString;
			if (query) {
				return DataProvider.resource.User.findAll({
					q: query,
					o: $scope.data.org.id,
					g: $scope.data.group.id
				}, {
					bypassCache: true
				});
			}
		}

		function confirmAndDeleteGroup() {
			Dialog.confirm({
				title: "Delete Room",
				content: "Do you wish to delete " + $scope.data.group.groupName + " room?",
				ok: "Delete",
				cancel: "Cancel"
			}).then(function (res) {
				$scope.appProgressBlocker.start("Deleting room.");
				Connect.post(URL.DELETE_GROUP, {
						//orgId: $scope.data.org.id,
						id: $scope.data.group.id
					})
					.then(function (res) {
						$scope.appProgressBlocker.stop(res.respMsg, {
							status: "isSuccess"
						});
						DataProvider.resource.Group.eject($scope.data.group.id);
						State.transitionBack();
					}).catch(function (error) {
					$scope.appProgressBlocker.stop(error.respMsg, {
						status: "isError",
						action: LANG.BUTTON.OK
					});
				})
			})
		}

		function fetchGrpDetails(options) {
			options = options || {};
			options.bypassCache = true;
			return DataProvider.resource.Group.find($stateParams.groupId, options)
				.then(function (groupModel) {
					group = groupModel;
					return groupModel;
				})
		}

		function findGrpDetails(options) {
			return DataProvider.resource.Group.get($stateParams.groupId)
		}

		function fetchGrpSubGroups(options) {
			var options = options || {};
			options.bypassCache = true;
			var params = {
				orgId: $scope.data.org.id,
				userId: $scope.session.userId,
				groupParentId: $scope.data.group.id,

				pageSize: 100
			};
			return DataProvider.resource.Group.findAll(params, options);
		}

		function findGrpSubGroups(options) {
		}

		function fetchGrpMembers(options) {
			var options = options || {};
			options.bypassCache = true;
			//return Connect.get(URL.GROUP_MEMBERS, {
			//  grpId: $scope.data.group.id,
			//  groupParentId: 0
			//});
			return group.loadMembers(null, options);
			//return DataProvider.resource.User.findAll({
			//	grpId: $scope.data.group.id,
			//	groupParentId: 0,
			//	pageSize: 100
			//}, {
			//	url: URL.GROUP_MEMBERS,
			//	bypassCache: true
			//});
		}

		function findGrpMembers(options) {
		}

		function fetchOrgDetails(options) {
			return DataProvider.resource.Organisation.find($stateParams.orgId, options)
		}

		function findOrgDetails(options) {
			return DataProvider.resource.Organisation.get($stateParams.orgId, options)
		}

		function findAndInviteMember(options) {
			UserSelector.showUserSelect({
				org: $scope.data.org,
				group: $scope.data.group,
				loadUsers: function (params, options) {
					return DataProvider.resource.User.findAll({
						q: params.queryString,
						o: $scope.data.org.id
					}, options);
				}
			})
		}

		function onGroupMemberListItemClick(user, $event) {
			return State.transitionTo('root.app.user', {
				id: user.id
			});
		}

		function showGroupMemberOptions(user, $event) {
			var userActions = [
				{
					text: "View Profile",
					value: "profile"
				}];

			$scope.session.userId == $scope.data.group.adminId
			&& $scope.data.group.adminId != user.id
			&& userActions.push({
				text: "Remove User",
				value: "remove"
			});

			Dialog.showListDialog(userActions, {
				$event: $event
			}).then(function (select) {
				switch (select.value) {
					case 'profile':
						State.transitionTo('root.app.user', {
							id: user.id
						});
						break;
					case 'remove':
						askAndRemoveGroupMember(user)
							.then(function (res) {
								refresh({
									bypassCache: true
								});
							});
						break;
				}
			})
		}

		function createSubGroup($event) {
			CreateGroupService.createGroup({
				org: $scope.data.org,
				parentGroup: $scope.data.group,
				showSelectOrg: false,
				showSelectGroup: false
			}, {
				$event: $event
			}).then(function (res) {
				var msg = res && res.respMsg;
				Dialog.showAlert(msg);
				refresh();


				if (res.resp) {
					$scope.transitionTo('root.app.group', {
						orgId: $stateParams.orgId,
						groupId: res.resp.id
					});
				}


			}).catch(function (error) {
				var msg = error && error.respMsg || "Error creating room.";
				Dialog.showAlert(msg)
			})
		}

		function showSubgroupProfile() {
		}

		function invokeFileChooser() {
			if ($scope.inProgress) return;
			$scope.uploadDone = false;
			$scope.error = null;

			//fileChooser.open(success, error);

			FileSystem.pickFile()
				.then(function (file) {
					FileService.showFilePickerConfirmDialog(file)
						.then(function (updatedFile) {
							FileService.queueForUpload(updatedFile.name, updatedFile.dataUrl, URL.GROUP_FILE_UPLOAD, {
									params: {
										fileTitle: updatedFile.displayName,
										groupId: $scope.data.group.id,
										userSessionId: $scope.session.id
									},
									tagName: TAG_GROUP_FILE_UPLOAD,
									blockUI: true,
									fileObject: updatedFile
								})
								.then(function (res) {
									refresh();
									var serverFileObject = res.resp;
									fetchGroupVaultFiles();

									//FileService.showFilePermissionsManager(serverFileObject,
									//	function (paginationRequestData) {
									//		var paginationRequestData = paginationRequestData || {
									//				pageSize: 25,
									//				pageNumber: 1
									//			};
									//		return Connect.get(URL.GROUP_GET_FILE_PERMISSIONS, {
									//			groupId: $scope.data.group.id,
									//			fileId: serverFileObject.id,
									//			pageSize: paginationRequestData.pageSize,
									//			pageNumber: paginationRequestData.pageNumber
									//		})
									//	},
									//	function (groupVaultFilePermissions) {
									//		var permissionUpdateData = preparePermissionUpdateData(groupVaultFilePermissions);
									//		return Connect.post(URL.GROUP_PUT_FILE_PERMISSIONS, permissionUpdateData)
									//	}, {
									//		fileContextDisplayName: $scope.data.group.groupName,
									//		forcePermissionUpdate: true
									//	})
									//	.then(function () {
									//	})
									//	.finally(function () {
									//		fetchGrpDetails({
									//			orgId: $stateParams.orgId,
									//			grpId: $stateParams.groupId
									//		})
									//			.then(function (res) {
									//				$scope.data.group = res;
									//			});
									//	});
								});
						});
				})
				.catch(function (reject) {
					console.log(reject);
				})
		}

		function onGroupVaultFileItemClick_primary(file) {
			if (!file.admin) {
				return Dialog.alert("Only the admin of this file has access to edit file permissions.")
			}
			FileService.showFilePermissionsManager(file,
				function (paginationRequestData) {
					var paginationRequestData = paginationRequestData || {
							pageSize: 25,
							pageNumber: 1
						};
					return Connect.get(URL.GROUP_GET_FILE_PERMISSIONS, {
						fileId: file.id,
						groupId: $scope.data.group.id,
						pageSize: paginationRequestData.pageSize,
						pageNumber: paginationRequestData.pageNumber
					})
				},
				function (groupVaultFilePermissions) {
					var permissionUpdateData = preparePermissionUpdateData(groupVaultFilePermissions);
					return Connect.post(URL.GROUP_PUT_FILE_PERMISSIONS, permissionUpdateData)
				}, {
					fileContextDisplayName: $scope.data.group.groupName
				});
		}

		function askAndDeleteFile(file) {
			var deferred = $q.defer();
			Dialog.confirm({
					content: 'Delete "' + file.fileDisplayName + '"',
					ok: "Delete",
					cancel: "Cancel"
				})
				.then(function () {
					blockUI.start("Deleting file..");
					Connect.get(URL.ORG_FILE_DELETE, {
							id: file.id
						})
						.then(function (res) {
							blockUI.stop(res.respMsg, {
								status: 'isSuccess'
							});
							deferred.resolve(res);
						})
						.catch(function (err) {
							deferred.reject(err);
							Dialog.alert({
								content: err.respMsg,
								ok: LANG.BUTTON.OK
							})
						})
						.finally(function () {
							fetchGrpDetails({
								orgId: $stateParams.orgId,
								grpId: $stateParams.groupId
							})
								.then(function (res) {
									$scope.data.group = res;
								});
						});
				});
			return deferred.promise;
		}

		function viewFile(file) {
			var url = URL.ORG_FILE_DOWNLOAD + ';' + $.param({
						jsessionid: $scope.session.id
					}) + '?' + $.param({
						userSessionId: $scope.session.id,
						id: file.id
					}),
				target = '_system';
			var ref = window.open(url, target);
		}

		function onGroupVaultFileItemClick_secondary(file, $event) {
			viewFile(file)
		}

		function onGroupVaultFileItem_hold(file, $event) {
			if (!file.canDelete) {
				return;
			}
			$scope.longPressActive = true;
			Dialog.showListDialog([{
					text: "Delete",
					value: "delete_file"
				}], {
					$event: $event
				})
				.then(function (select) {
					switch (select.value) {
						case 'delete_file':
							askAndDeleteFile(file)
								.then(function (res) {
									refresh();
								});
							break;
					}
				})
				.finally(function () {
					$scope.longPressActive = false;
				});
		}

		function fetchGroupVaultFiles() {
			var orgId = $scope.data.org.id,
				groupId = $scope.data.group.id;
			$scope.data.vaultInfo = $scope.data.vaultInfo || $scope.data.group.vaultInfo || {};
			return group.loadFiles({pageSize: 100}, {bypassCache: true})
				.then(function (res) {
					fetchGrpDetails({
						params: {
							orgId: orgId,
							grpId: groupId
						}
					})
						.then(function (groupData) {
							$timeout(function () {
								$scope.data.vaultInfo = groupData.vaultInfo;
							}, 100);
						});
					return res;
				});
		}

		function preparePermissionUpdateData(permissions) {
			var updateData = angular.copy(permissions);
			if (angular.isArray(updateData.users)) {
				for (var i in updateData.users) {
					updateData.users[i].userId = updateData.users[i].user.id;
					delete(updateData.users[i].user);
				}
			} else {
				updateData.users = [];
			}
			return updateData;
		}

		initScope();


		function initializeGroupChatClient() {
			$scope._connStatus = {
				isInARoom: false,
				loadingMessages: false
			};

			$scope.messageStack = [];
			$scope.messageStackInfo = {
				isOlderMessagesPending: true
			};
			$scope.roomList = [];
			$scope.chatFormModel = {
				newMessage: ""
			};

			chatroomId = $scope.data.group.chatRoomId;
			chat_username = $scope.session.userInfo.chatUserName;
			chat_password = $scope.session.userInfo.chatPassword;

			//ChatService.initialize(BOSH_SERVICE_ENDPOINT);
			//$scope.connect();
			$scope.joinRoom();
		}

		function getGroupChatNickName() {
			return 'U' + $scope.session.userInfo.id + '-G' + groupId;
		}

		/*----- Chat ----------*/
		var chat_username = null,
			chat_password = null,
			chatroomId = null,
			waitee, chat_nickName = getGroupChatNickName();

		var SHOW_TIME_OFFSET_THRESHOLD = 5 * 60 * 60 * 1000,
			TIMESTAMP_UPDATE_TIMER = 30000,
			TIMESTAMP_UPDATE_THROTTLE = 2000,
			PAGE_SIZE = 20;
		self.scopeListeners = {
			mockChatListeners: {}
		};

		$scope.$on('$destroy', function () {
			ChatterService.leaveChatroom(chatroomId)
		});

		_listenToChatServiceEvents();
		_attachChatListWatcher();

		$scope.sendMessage = sendMessage;

		$scope.loadEarlierMessages = function () {
			$scope._connStatus.loadingMessages = true;
			return ChatterService.fetchOlderChatroomMessages(chatroomId, 25,
					$scope.messageStackInfo.currentOldestMessageTimestamp || null)
				.then(function (res) {
					if (res.length > 0) {
						$scope.messageStackInfo.currentOldestMessageTimestamp = res[res.length - 1].timestamp;
					} else {
						$scope.messageStackInfo.isOlderMessagesPending = false;
					}
					$scope.messageStack = _.unique(res.reverse().concat($scope.messageStack));
					$timeout(function () {
					});
				})
				.catch(function () {
				})
				.finally(function () {
					$scope._connStatus.loadingMessages = false;
				});
		};

		$scope.joinRoom = function () {
			var roomId = chatroomId,
				nickName = chat_nickName;

			console.log("joining:" + chatroomId + " nickname:" + chat_nickName);
			showConnectNotification("Joining room...");
			return ChatterService.readyChatroom(roomId, nickName)
				.then(function () {
					showConnectNotification("Enter message");
					$scope._connStatus.isInARoom = true;
					$scope.loadEarlierMessages()
						.then(function () {
							_updateScroll();
						});
					waitee = ChatterService.waitForChatroomMessages(chatroomId, nickName);
					waitee.promise
						.then(null, null, function (message) {
							//console.log(noti);
							appendNewMessage(message)
						})
				})
				.catch(function () {
					$scope._connStatus.false = true;
				})
				.finally(function () {
					$scope._connActive = false;
				})
		};

		$scope.exitRoom = function () {
			var roomId = chatroomId,
				nickName = chat_nickName;
			return ChatterService.leaveChatroom(roomId)
		};
		$scope.onInputFieldKeyPress = onInputFieldKeyPress;

		//ChatService.initialize(BOSH_SERVICE_ENDPOINT);
		//$scope.connect();

		function _attachChatListWatcher() {
			self.scopeListeners.mockChatListeners.promise_timeStampWatcher = $interval(function () {
				_computeTimeStampOffset();
			}, TIMESTAMP_UPDATE_TIMER);
		}

		function _listenToChatServiceEvents() {
			self.scopeListeners.mockChatListeners.dereg_connecting = $scope.$on('ChatService:connecting', function () {
				showConnectNotification("Connecting...");
			});

			self.scopeListeners.mockChatListeners.dereg_connfail = $scope.$on('ChatService:connfail', function () {
				$scope._connStatus.isInARoom = false;
				showConnectNotification("Connection failed.");
			});

			self.scopeListeners.mockChatListeners.dereg_connected = $scope.$on('ChatService:connected', function () {
				showConnectNotification("Connected");
				//onConnect();
			});

			self.scopeListeners.mockChatListeners.dereg_disconnected = $scope.$on('ChatService:disconnected', function () {
				showConnectNotification("Disconnected");
				onDisconnect();
			});

			self.scopeListeners.mockChatListeners.dereg_message
				= $scope.$on('ChatService:message', function ($event, message) {
				appendNewMessage(message);
				_computeTimeStampOffset();
			});

			self.scopeListeners.mockChatListeners.dereg_presence
				= $scope.$on('ChatService:presence', function ($event, message) {
				$timeout(function () {
					showConnectNotification("Send to room chat room");
					$scope._connStatus.isInARoom = true;
				}, 500);
				//fetchChatroomMessages()
				//  .then(function () {
				//    $timeout(function () {
				//      _updateScroll();
				//    }, 100)
				//  });
				//console.log(message);
			});
		}

		function appendNewMessage(newMessage) {
			console.log(newMessage);
			if (_.findIndex($scope.messageStack, function (message) {
					return newMessage.id == message.id;
				}) == -1) {
				$scope.messageStack.push(newMessage);
			}
			_updateScroll();
		}

		function fetchChatroomMessages(opts) {
			var options = opts || {},
				deferred = $q.defer(),
				oldestChatId = $scope.messageStackInfo.oldestChatId || 0;

			var _params = {
				chatroomId: $scope.data.group.chatRoomId,
				lastRowId: oldestChatId,
				pageSize: options.pageSize || 25
			};
			Connect.get(URL.CHAT_HISTORY, _params)
				.then(function (res) {
					//_parseChatHistoryMessages(res.resp.messages);
					var messages = _parseChatHistoryMessages(res.resp.messages);
					if (messages && messages.length > 0) {
						$scope.messageStackInfo.oldestChatId = messages[messages.length - 1].id;
						$scope.messageStackInfo.isOlderMessagesPending = true;
					} else {
						$scope.messageStackInfo.isOlderMessagesPending = false;
					}
					angular.forEach(messages, function (msg) {
						$scope.messageStack.unshift(msg);
					});
					deferred.resolve(res);
				})
				.catch(function (res) {
					deferred.reject();
				})
				.finally(function (res) {
				});
			return deferred.promise;

			function _parseChatHistoryMessages(msgArray) {
				var newParsedMessagesStack = [];
				angular.forEach(msgArray, function (msg) {
					newParsedMessagesStack.push(ChatService.parseChatroomHistoryMessage(msg));
				});
				_computeTimeStampOffset();
				return newParsedMessagesStack;
			}
		}

		function onConnect() {
			$scope.messageStack = [];
			$scope._connStatus.isConnected = true;
			$scope._connActive = false;

			$timeout(function () {
				$scope.joinRoom();
			}, 500);
		}

		function showConnectNotification(msg) {
			$scope._connStatusMessage = msg;
		}

		function onDisconnect() {
			$scope._connActive = false;
			$scope._connStatus.isConnected = false;
			$scope._connStatus.isInARoom = false;
		}

		function onAuthFail() {
			$scope._connActive = false;
		}

		function onError() {
			$scope._connActive = false;
		}

		function onInputFieldKeyPress($event, msg) {
			if ($event.keyCode == 13) {
				//return sendMessage();
			}
		}

		function sendMessage() {
			if ($scope.chatFormModel.newMessage) {
				var msgObj = ChatService.prepareGroupChatMessageJSON($scope.chatFormModel.newMessage, $scope.session.userInfo.userFirstName);
				ChatterService.sendMessageToChatroom(chatroomId, msgObj)
					.then(function () {
					})
					.finally(function () {
					});
				$scope.chatFormModel.newMessage = "";
			}
		}

		var _updateScroll = _.throttle(function _updateScroll() {
				self.scrollListElem = mobos.Platform.isIOS()
					? self.scrollListElem || document.getElementById('group_detail_tab_content').parentNode
					: document.body;

				$timeout(function () {
					mobos.DomUtil.scrollToBottom(self.scrollListElem);
				}, 100);

			},
			TIMESTAMP_UPDATE_THROTTLE, {
				trailing: true
			});

		var _computeTimeStampOffset = _.throttle(function _computeTimeStampOffset() {
				var currDateTime = new Date();
				$timeout(function () {
					angular.forEach($scope.messageStack, function (message) {
						var offset = mobos.Utils.getDateTimeOffset(message.timestamp, currDateTime);
						if (offset.milli < SHOW_TIME_OFFSET_THRESHOLD) {
							if (offset.hr > 0) {
								message.displayTime = offset.hr + "h"
							} else if (offset.min > 0) {
								message.displayTime = offset.min + "m"
							} else {
								message.displayTime = offset.sec + "s"
							}
						} else {
						}
					});
				});
			},
			TIMESTAMP_UPDATE_THROTTLE, {
				trailing: true
			});
		/*---------------------*/

	}

})();
