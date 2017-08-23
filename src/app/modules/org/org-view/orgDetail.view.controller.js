/**
 * Created by sudhir on 26/5/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.controller('OrgDetailViewController', [
			'$scope', '$controller', '$q', '$timeout', '$interval',
			'$stateParams', 'State', 'DataProvider',
			'UserSelector', 'UserInvitationService',
			'FileSystem', 'FileService',
			'StropheService', 'ChatterService',
			'CreateGroupService', 'VaultServices', 'JOB',
			'mDialog', 'blockUI', 'VaultFilesWorkflow', 'VaultFileRename',
			'Connect', 'URL', 'CATEGORY_TYPE', 'JobAdminService',
			OrgDetailViewController])
		/*.controller('OrgMemberListController', [
		 '$scope', '$controller',
		 '$stateParams', 'DataProvider', 'UserInvitationService',
		 'State', 'mDialog', 'blockUI',
		 'Lang', 'URL', 'JobAdminService',
		 OrgMemberListController
		 ])*/
	;

	function OrgDetailViewController($scope, $controller, $q, $timeout, $interval
		, $stateParams, State, DataProvider
		, UserSelector, UserInvitationService
		, FileSystem, FileService
		, ChatService, ChatterService
		, CreateGroupService, VaultServices, JOB
		, Dialog, blockUI, VaultFilesWorkflow, VaultFileRename
		, Connect, URL, CATEGORY_TYPE, JobAdminService) {
		var self = this
			, TAG_ORG_FILE_UPLOAD = "orgVaultFileUpload"
			, orgId = $stateParams.orgId
			, orgModel = DataProvider.resource.Organisation.get(orgId)
			, OrgJobsLoader
			;
		if (orgModel) {
			OrgJobsLoader = _createOrgJobLoaderInstance();
		}


		angular.extend(self, $controller('ViewBaseController', {$scope: $scope}));
		angular.extend(self, $controller('ViewDataBaseController', {$scope: $scope}));
		var LANG = $scope.LANG;

		self.viewData = {
			org: self.initializeViewDataBaseController('orgDetails', fetchOrgDetails, findOrgDetails),
			orgGroups: self.initializeViewDataBaseController('orgGroups', fetchOrgGroups, findOrgGroups),
			orgVaultFiles: self.initializeViewDataBaseController('orgVaultFiles', fetchOrgVaultFiles, findOrgVaultFiles),
			orgMembers: self.initializeViewDataBaseController('orgMembers',
				fetchOrgMembers, findOrgMembers),
			orgJobs: self.initializeViewDataBaseController('orgJobs', fetchOrgJobs, findOrgJobs)
		};

		self.menuItems = [{
			name: 'refresh',
			value: self.LANG.OPTIONS_MENU.REFRESH
		}];

		$scope.viewTabs = {
			TAB_INFO: {
				allowedActions: [
					"DELETE",
					"EDIT"
				]
			},
			TAB_CHAT: {
				allowedActions: [
					"REFRESH"
				]
			},
			TAB_ORG_VAULT: {
				allowedActions: [
					//"REFRESH",
					"ADD_NEW_FILE", "REMOVE_FILE", "RENAME_FILE", "COPY_FILE", "DOWNLOAD_FILE"
				]
			},
			TAB_MEMBERS: {
				allowedActions: [
					//"REFRESH",
					"INVITE_USER"
				]
			},
			TAB_GROUPS: {
				allowedActions: [
					//"REFRESH",
					"CREATE_GROUP"
				]
			},
			TAB_JOB: {
				allowedActions: [
					//"REFRESH",
					"CREATE_JOB"
				]
			}
		};

		self.tabs = ['TAB_INFO', 'TAB_MEMBERS', 'TAB_GROUPS', 'TAB_CHAT', 'TAB_ORG_VAULT', 'TAB_JOB'];

		angular.extend($scope,
			{
				xtras: {
					flag: {
						// Allow user to create new groups.
						isAllowed_create_group: false,

						// Allow user to add new file to the organisation data vault.
						isAllowed_add_file: true,

						fileDownloadInProgress: false,

						isChatCredentialsAvailable: false,

						isChatEnabled: false,

						isVaultEnabled: true,

						isNavigateDone: false
					},
					default_tab_index: 0
				},
				data: {
					/*org: {},*/
					orgGroups: [],
					orgVaultFiles: null,
					vaultInfo: null,
					org: DataProvider.resource.Organisation.get($stateParams.orgId),
					//groups: [],
					groupPage: {
						pageSize: 25,
						currPage: 1,
						nextPage: 2
					}
				},
				ui: {
					refreshing: false,
					isNextPageAvailable: false,
					loadingNext: false
				},
				enableActions: true,
				tabs: {
					TAB_INFO: {
						src: "app/modules/org/org-view/org-preview.fragment.html"
					},
					TAB_GROUPS: {
						src: "app/modules/org/org-view/org-members.fragment.html"
					},
					TAB_ORG_VAULT: {
						src: "app/modules/org/org-view/org-preview.fragment.html"
					}
				},
				tab_default: "TAB_INFO",
				tab_curr: "TAB_INFO",
				ROLE_NAMES: JOB.ROLE_NAMES
			}, {
				refresh: refresh,
				showOptionsMenu: showOptionsMenu,
				onTabSelect: onTabSelect,

				invokeFileChooser: invokeFileChooser,
				removeVaultFiles: findAndRemoveVaultFiles,
				findAndRemoveVaultFiles: findAndRemoveVaultFiles,
				findAndRenameVaultFiles: findAndRenameVaultFiles,
				findAndCopyVaultFiles: findAndCopyVaultFiles,
				findAndDownloadVaultFiles: findAndDownloadVaultFiles,

				findThenInviteUser: findThenInviteUser,
				askAndRemoveOrgMember: askAndRemoveOrgMember,
				askAndDeleteOrg: askAndDeleteOrg,
				createGroup: createGroup,
				createThenEditJob: createThenEditJob,

				showOrgMemberOptions: showOrgMemberOptions,
				showGroupOptions: showGroupOptions,
				loadNextPage: loadNextPage,
				onOrgMemberListItemClick: onOrgMemberListItemClick,

				loadNextOrgJobPage: loadNextOrgJobPage,

				isNextOrgJobPageAvailable: function () {
					return OrgJobsLoader.isNextPageAvailable();
				},

				onOrgGroupListItemClick: onOrgGroupListItemClick,
				onOrgGroupListItemLongPress: onOrgGroupListItemLongPress,

				onOrgVaultFileItemClick_primary: onOrgVaultFileItemClick_primary,
				onOrgVaultFileItemClick_secondary: onOrgVaultFileItemClick_secondary,
				onOrgVaultFileItemLongPress: onOrgVaultFileItemLongPress,

				viewFile: viewFile
			});

		/* org job scope  */
		$scope.jobItemClickAction = jobItemClickAction;

		State.waitForTransitionComplete().then(function () {
			$scope.data.org = findOrgDetails();
			refresh();
			$scope.xtras.title = ($scope.data.org && $scope.data.org.orgName) || LANG.ORGANISATION.DETAILS.DEFAULT.TITLE;
		});

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

		function findAndCopyVaultFiles() {
			var deferred = $q.defer();
			blockUI.start(LANG.GROUP.LOADING_MSG.FETCHING_OWNER_FILES);
			orgModel.loadFiles({sendToAll: true})
				.then(function (vaultFiles) {
					if (vaultFiles && vaultFiles.length > 0) {
						blockUI.stop();
						VaultFilesWorkflow.selectAndCopyFiles(vaultFiles,
							function (selectedFiles, copyDestination) {
								var src =
								{
									catId: orgModel.id,
									catType: CATEGORY_TYPE.ORG
								}, dst =
								{
									catType: copyDestination.catType,
									catId: copyDestination.id
								};
								blockUI.start(LANG.VAULT.LOADING_MSG.COPY_IN_PROGRESS);
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
					}
					else {
						blockUI.stop(LANG.VAULT.LABEL.NO_FILES_FOUND, {
							status: 'isSuccess',
							action: LANG.BUTTON.OK
						})
						deferred.reject();
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

		function _fetchCopyDestinationList() {
			return orgModel.fetchVaultFileCopyDestinations()
				.then(function (res) {
					return VaultServices.prepCopyDestinationResults(res);
				})
				.catch(function (err) {
					return err;
				})
		}

		function fetchVaultFilesWithAdminRights() {
			var orgId = orgModel.id;
			return DataProvider.resource.File.findAll({
					orgId: orgId
				}, {
					url: URL.ORG_VAULT_OWNER_FILE_LIST,
					bypassCache: true
				})
				.then(function (files) {
					return files;
				});
		}

		function findAndRemoveVaultFiles() {
			var fileList = [];
			blockUI.start(LANG.ORGANISATION.LOADING_MSG.FETCHING_OWNER_FILES);
			fetchVaultFilesWithAdminRights()
				.then(function (files) {
					fileList = files;
					if (files && files.length > 0) {
						blockUI.stop();
						VaultFilesWorkflow.selectAndExecuteActionOnFiles(fileList,
							function (fileList) {
								var deferred = $q.defer();
								blockUI.start(LANG.VAULT.LOADING_MSG.DELETING_FILES);
								orgModel.deleteFiles(fileList)
									.then(function (res) {
										deferred.resolve(res);
									})
									.catch(function (err) {
										deferred.reject(err)
									})
									.finally(function () {
										blockUI.stop();
									})
								;
								return deferred.promise;
							},
							{
								title: LANG.VAULT.LABEL.TITLE_DELETE_FILES,
								actionButtonText: LANG.BUTTON.DELETE,
								cancelButtonText: LANG.BUTTON.CANCEL
							});
					} else {
						blockUI.stop(LANG.VAULT.LABEL.NO_FILES_FOUND, {
							status: 'isSuccess',
							action: LANG.BUTTON.OK
						})
					}
				})
				.catch(function (err) {
					blockUI.stop(err.respMsg, {
						status: 'isError',
						action: LANG.BUTTON.OK
					});
					Dialog.alert(err.respMsg);
				})
		}

		function findAndRenameVaultFiles() {
			blockUI.start(LANG.ORGANISATION.LOADING_MSG.FETCHING_OWNER_FILES);
			fetchVaultFilesWithAdminRights()
				.then(function (files) {
					if (files && files.length > 0) {
						blockUI.stop();
						VaultFileRename.renameFiles(files,
							function (updatedFiles) {
								var deferred = $q.defer();
								blockUI.start(LANG.VAULT.LOADING_MSG.RENAME_FILES);
								orgModel.updateFiles(DataProvider.pluckAttrArrayProperties(updatedFiles, ['id', 'fileDisplayName']), {
										url: URL.VAULT_FILE_RENAME
									})
									.then(function (res) {
										deferred.resolve(res);
									})
									.catch(function (err) {
										deferred.reject(err);
									})
									.finally(function () {
										blockUI.stop();
									})
								;
								return deferred.promise;
							}, {
								title: "Rename Files",
								actionButtonText: LANG.BUTTON.UPDATE,
								cancelButtonText: LANG.BUTTON.CANCEL
							});
					} else {
						blockUI.stop(LANG.VAULT.LABEL.NO_FILES_FOUND, {
							status: 'isSuccess',
							action: LANG.BUTTON.OK
						})
					}
				})
				.catch(function (err) {
					blockUI.stop(err.respMsg, {
						status: 'isError',
						action: LANG.BUTTON.OK
					});
				})
		}

		function createThenEditJob() {
			JobAdminService.CreateJob().then(function (job) {
				$scope.transitionTo('root.app.job-view', {
					jobId: job.id
				});
				//var newJobData = result;
				//refresh();
			});
		}

		function _createOrgJobLoaderInstance() {
			return DataProvider.PaginatedListLoaderFactory(
				orgModel, 'loadJobs', {}, 25, {
					getItemCount: function () {
						return orgModel.jobs.length;
					}
				});
		}

		function onTabSelect(tabName, options) {
			$scope.tab_curr = tabName;
			switch (tabName) {
				case 'TAB_INFO':
					// if current user is the admin of the organisation, enable edit option
					$scope.tab_curr = 'TAB_INFO';
					if ($scope.data.org &&
						$scope.data.org.adminId == $stateParams.userId) {
					} else {
					}
					$scope.orgDetails.refresh(options).then(function () {
						orgModel = $scope.data.org = self.viewData.org.orgDetails.data;
						chat_nickName = getOrgChatNickName();
						if (!OrgJobsLoader) {
							OrgJobsLoader = _createOrgJobLoaderInstance()
						}
						$scope.xtras.flag.isChatEnabled = true;
						if (!$scope.xtras.isNavigateDone) {
							$scope.xtras.default_tab_index = self.tabs.indexOf($stateParams.tab) >= 0
								? self.tabs.indexOf($stateParams.tab)
								: 0;
							$scope.xtras.isNavigateDone = true;
						}
						if ($scope.data.org.chatRoomId) {
							$scope.xtras.flag.isChatCredentialsAvailable = true;
						} else {
							$scope.xtras.flag.isChatCredentialsAvailable = false;
						}
						$scope.data.orgGroups = $scope.data.orgGroups || $scope.data.org.groups;

						//$scope.data.orgVaultFiles = $scope.data.orgVaultFiles || $scope.data.orgVaultFiles;

						// Add download params data to the file object.
						angular.forEach($scope.data.org.files, function (file) {
							file.download = {
								params: {
									orgId: $stateParams.orgId
								}
							}
						});
						$scope.data.orgVaultFiles = VaultServices.Inject($scope.data.org.files)
							|| $scope.data.orgVaultFiles || [];

						$scope.xtras.title = $scope.data.org.orgName;
						/**
						 * If current user is the admin of the organisation,
						 * enable admin controls of the view;
						 * */
						if ($scope.session.userId == $scope.data.org.adminId) {
							enableAdminControls();
						}

						$scope.xtras.flag.isAllowed_create_group = true;

					});
					break;

				case 'TAB_JOB':
					initializeOrgJobs();
					break;

				case 'TAB_CHAT':
					initializeOrgChatClient();
					break;

				case 'TAB_GROUPS':

					initializeOrgGroup();

					break;

				case 'TAB_MEMBERS':
					$scope.tab_curr = 'TAB_MEMBERS';
					var orgMembers = $scope.data.orgMembers || [];
					injectOrgMembers(orgMembers);
					var memberArray = _.pluck(orgMembers, 'id');

					$scope.data.orgMembers = DataProvider.resource.User.getAll(memberArray);

					$scope.orgMembers.refresh()
						//fetchOrgMembers()
						.then(function (res) {
							$scope.data.orgMembers = self.viewData.orgMembers.orgMembers.data;
						})
						.catch(function (error) {
							console.log(error);
						})
					;


					break;

				case 'TAB_ORG_VAULT':
					$scope.tab_curr = 'TAB_ORG_VAULT';
					$scope.queuedFiles = FileService.filterByTagName(TAG_ORG_FILE_UPLOAD);

					$scope.orgVaultFiles.refresh()
						.then(function (res) {
							$scope.data.orgVaultFiles = self.viewData.orgVaultFiles.orgVaultFiles.data;
						})
						.catch(function (err) {
							console.log(err);
						})
					;

					break;

				default:
			}

			function initializeOrgJobs() {
				$scope.tab_curr = 'TAB_JOB';
				$scope.orgJobsLoaderStore = OrgJobsLoader.getActivityStore();
				OrgJobsLoader.resetPagination();
				$scope.orgJobs.refresh();
			}

			function initializeOrgGroup() {

				$scope.tab_curr = 'TAB_GROUPS';


				$scope.data.groupPage.currPage = 1;
				$scope.data.groupPage.nextPage = 2;
				$scope.orgGroups.refresh({bypassCache: true})
					.then(function (res) {


						$scope.data.orgGroups = res;

						var pageData = angular.copy(DataProvider.resource.Group.result.resp.paginationMetaData);
						$scope.ui.isNextPageAvailable = $scope.data.orgGroups.length < pageData.totalResults;

						if ($scope.ui.isNextPageAvailable) {
							$scope.ui.loadingNext = true;
							$scope.data.groupPage.currPage++;
							$scope.data.groupPage.nextPage++;
						}
						else {
							$scope.ui.loadingNext = false;
						}

					})
					.catch(function (err) {
					})
					.finally(function () {
					});

			}

			// Update Images for all org users.
			function injectOrgMembers(users) {
				angular.forEach(users, function (orgMember) {
					if (!DataProvider.resource.User.get(orgMember.id)) {
						DataProvider.resource.User.inject(orgMember);
					}
					DataProvider.resource.User.get(orgMember.id).refreshImageHash();
				});
			}

		}

		function loadNextOrgJobPage() {
			if ($scope.orgJobsLoaderStore.isLoading) return;
			//OrgJobsLoader.incrementPageNumber();
			$scope.orgJobs.refresh();
		}

		function loadNextPage() {
			$scope.ui.loadingNext = true;
			$scope.orgGroups.refresh()
				.then(function (res) {

					$scope.data.orgGroups = _.uniq($scope.data.orgGroups.concat(res));

					var pageData = angular.copy(DataProvider.resource.Group.result.resp.paginationMetaData);
					$scope.ui.isNextPageAvailable = $scope.data.orgGroups.length < pageData.totalResults;

					if ($scope.ui.isNextPageAvailable) {
						$scope.ui.loadingNext = true;
						$scope.data.groupPage.currPage++;
						$scope.data.groupPage.nextPage++;
					}
					else {
						$scope.ui.loadingNext = false;
					}


				})
				.catch(function (err) {
				})
				.finally(function () {

				})
		}

		function fetchOrgJobs() {
			return OrgJobsLoader.fn()
		}

		function findOrgJobs() {
			return $scope.data.org.$_jobs;
		}

		function jobItemClickAction($event, job) {
			if (job && job.id) {
				return $scope.transitionTo('root.app.job-view', {
					jobId: job.id
				});
			}
		}

		function findOrgVaultFiles() {
			return self.viewData.org.orgDetails.data.files;
		}

		function fetchOrgVaultFiles() {
			var orgId = $scope.data.org.id;
			DataProvider.resource.File.ejectAll();
			return VaultServices.FetchOrgVaultFiles(orgId, {
					bypassCache: true
				})
				.then(function (res) {
					var vaultFiles = res;
					return fetchOrgDetails()
						.then(function (orgData) {
							$timeout(function () {
								$scope.data.vaultInfo = orgData.vaultInfo;
							}, 100);
							return vaultFiles;
						});
				})
				.finally(function () {
				})
				;
		}

		function fetchOrgGroups() {
			var _params = {
				orgId: $scope.data.org.id,
				pageSize: $scope.data.groupPage.pageSize,
				pageNumber: $scope.data.groupPage.currPage
			};
			return DataProvider.resource.Group.findAll(_params, {
				bypassCache: true
			});
		}

		function showGroupOptions(group, $event) {
			$scope.transitionTo('root.app.group', {
				orgId: $stateParams.orgId,
				groupId: group.groupId
			});
		}

		function findOrgGroups() {
			//DataProvider.resource.Group.filter({
			//  where: {
			//    orgId: $scope.data.org.id
			//  }
			//})
			return self.viewData.org.orgDetails.data.groups;
		}

		function refresh(options) {
			onTabSelect($scope.tab_curr, options)
		}

		function askAndRemoveOrgMember(user) {
			var intentBundle = {
				user: user,
				org: $scope.data.org
			};
			return Dialog.confirm({
				title: "Remove User",
				content: 'Do you wish to remove ' + user.userFirstName + ' ' + user.userLastName + ' from this WorkSpace?',
				ok: "Remove",
				cancel: "Cancel"
			}).then(function (res) {
				UserInvitationService.ejectUserFromOrg(intentBundle.user, intentBundle.org).then(function (resp) {
					Dialog.alert(resp.respMsg);
					refresh({bypassCache: true})
				}).catch(function (error) {
					Dialog.alert(error.respMsg)
				})
			})
		}

		function askAndDeleteOrg(options) {
			var options = options || {};
			var org = $scope.data.org;
			var message = 'Do you wish to delete "' + org.orgName + '"';
			Dialog.showConfirm({
					title: "Delete WorkSpace",
					content: message,
					$event: options.$event,
					ok: LANG.BUTTON.DELETE,
					cancel: LANG.BUTTON.CANCEL
				})
				.then(function () {
					blockUI.start('Deleting WorkSpace "' + org.orgName + '"');
					DataProvider.resource.Organisation.destroy(org.id)
						.then(function (res) {
							blockUI.stop(res.respMsg, {
								status: 'isSuccess'
							});
							State.transitionBack();
						}, null, function (noti) {
							var respMesage = noti.respMsg ? noti.respMsg : LANG.SUCCESS.SERVICE_SUCCESS;
							Dialog.showAlert(respMesage);
						})
						.catch(function (error) {
							blockUI.stop(error.respMsg, {
								status: 'isError',
								action: LANG.BUTTON.OK
							})
						})
					;
				})
				.catch(function () {
					// Do nothing!
				});
		}

		function enableAdminControls() {
			if (!$scope.xtras.flag.isAdmin) {
				self.menuItems.push({
					name: "edit",
					value: self.LANG.OPTIONS_MENU.EDIT
				});
			}
			$scope.xtras.flag.isAdmin = true;
		}

		function fetchOrgDetails() {
			return DataProvider.resource.Organisation.find($stateParams.orgId, {
				bypassCache: true
			});
		}

		function findOrgDetails() {
			return DataProvider.resource.Organisation.get($stateParams.orgId);
		}

		function showOptionsMenu(e) {
			self.Popup.showMenu({
				targetEl: e.currentTarget || e.target,
				menuItems: self.menuItems,
				align: 'right'
			}).then(function (option, $event) {
					switch (option) {
						case 'refresh':
							$scope.refresh({bypassCache: true});
							break;
						case 'edit':
							$scope.transitionTo('root.app.org-edit', {
								userId: $scope.session.userId,
								orgId: $scope.data.org.organizationEntity.id
							});
							break;
						default:
					}
				}
			)
		}

		function onOrgMemberListItemClick(member, $event) {
			return State.transitionTo('root.app.user', {
				id: member.id
			});
			//if ($scope.session.userId == $scope.data.org.adminId) {
			//	// If the selected user is the admin of the org, only view-profile options is available.
			//	if (user.id == $scope.data.org.adminId) {
			//		State.transitionTo('root.app.user', {
			//			id: user.id
			//		});
			//	} else {
			//		// Show Org member options
			//		return showOrgMemberOptions(user, $event);
			//	}
			//} else {
			//	// Regular user actions..
			//	State.transitionTo('root.app.user', {
			//		id: user.id
			//	});
			//	//return UserProfilePreviewService.showPreview(user, {
			//	//  targetEvent: $event
			//	//})
			//}
		}

		function showOrgMemberOptions(user, $event) {
			var userActions = [
				{
					text: "View Profile",
					value: "profile"
				}];

			$scope.session.userId == $scope.data.org.adminId
			&& user.id != $scope.data.org.adminId
			&& userActions.push({
				text: "Remove member",
				value: "removeMember"
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
					case 'removeMember':
						askAndRemoveOrgMember(user)
							.then(function (res) {
								refresh({bypassCache: true});
							});
						break;
				}
			});
		}

		function findThenInviteUser(orgEntity, options) {
			$scope.enableActions = false;
			options = options || {};
			options.autoClose = false;
			var org = orgEntity;
			var bundle = {};
			UserSelector.showUserSelect({
					org: orgEntity,
					loadUsers: function (params, options) {
						return DataProvider.resource.User.findAll({
							q: params.queryString,
							o: $scope.data.org.id
						}, options);
					}
				}, options)
				.then(null, null, function (bundle) {
					bundle = bundle;
					var user = bundle.selection;
					var userSelectCtrl = bundle.ctrl;
					var targetBundle = {
						toOrg: org
					};
					UserInvitationService.showPrepareInvitationDialog(user, targetBundle, options)
						.then(function (res) {
							console.log(res);
							userSelectCtrl.cancel();
						})
						.finally(function () {
							$scope.enableActions = true;
						})
				})
				.finally(function () {
					$scope.enableActions = true;
					bundle.cancel();
				})
			;
		}

		function createGroup($event) {
			var intent = {
				org: $scope.data.org
			};
			CreateGroupService.createGroup(intent, {
					$event: $event
				})
				.then(function (result) {
					Dialog.showAlert(result.respMsg);

					//	$scope.data.orgGroups = DataProvider.resource.Group.getAll();


					/*$scope.orgGroups.refresh({bypassCache: true}).then(function (res) {
					 $scope.data.orgGroups = self.viewData.orgGroups.orgGroups.data;
					 });*/
					if (result.resp) {
						$scope.transitionTo('root.app.group', {
							orgId: $stateParams.orgId,
							groupId: result.resp.id
						});
					}

				})
				.catch(function (error) {
					Dialog.showAlert(error.respMsg);
				});
			//initializeOrgGroup();

		}

		function onOrgGroupListItemClick(group) {
			var _groupId = group.groupId || group.id;
			$scope.transitionTo('root.app.group', {
				userId: $scope.session.userId,
				orgId: $scope.data.org.id,
				groupId: _groupId
			});
		}

		function onOrgGroupListItemLongPress(group) {
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
							FileService.queueForUpload(updatedFile.name, updatedFile.dataUrl, URL.ORG_FILE_UPLOAD, {
									params: {
										fileTitle: updatedFile.displayName,
										orgId: $scope.data.org.id,
										userSessionId: $scope.session.id
									},
									tagName: TAG_ORG_FILE_UPLOAD,
									blockUI: true,
									fileObject: updatedFile
								})
								.then(function (res) {
									refresh();
									var serverFileObject = res.resp;
									fetchOrgDetails();
									//FileService.showFilePermissionsManager(serverFileObject,
									//	function (paginationRequestData) {
									//		var paginationRequestData = paginationRequestData || {
									//				pageSize: 25,
									//				pageNumber: 1
									//			};
									//		return Connect.get(URL.ORG_GET_FILE_PERMISSIONS, {
									//			orgId: $scope.data.org.id,
									//			fileId: serverFileObject.id,
									//			pageSize: paginationRequestData.pageSize,
									//			pageNumber: paginationRequestData.pageNumber
									//		})
									//	},
									//	function (permissions) {
									//		var permissionsUpdateData = preparePermissionUpdateData(permissions);
									//		return Connect.post(URL.ORG_PUT_FILE_PERMISSIONS, permissionsUpdateData);
									//	}, {
									//		fileContextDisplayName: $scope.data.org.orgName,
									//		forcePermissionUpdate: true
									//	})
									//	.finally(function () {
									//		fetchOrgDetails();
									//	});
								});
						});
				})
				.catch(function (reject) {
					console.log(reject);
				})
		}

		function onOrgVaultFileItemClick_primary(file) {
			if (!file.admin) {
				return Dialog.alert("Only the admin of this file has access to edit file permissions.")
			}
			FileService.showFilePermissionsManager(file,
				function (paginationRequestData) {
					var paginationRequestData = paginationRequestData || {
							pageSize: 25,
							pageNumber: 1
						};
					return Connect.get(URL.ORG_GET_FILE_PERMISSIONS, {
						orgId: $scope.data.org.id,
						fileId: file.id,
						pageSize: paginationRequestData.pageSize,
						pageNumber: paginationRequestData.pageNumber
					});
				},
				function (permissions) {
					var permissionsUpdateData = preparePermissionUpdateData(permissions);
					return Connect.post(URL.ORG_PUT_FILE_PERMISSIONS, permissionsUpdateData);
				}, {
					fileContextDisplayName: $scope.data.org.orgName
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

		function onOrgVaultFileItemLongPress(file, $event) {
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
				})
			;
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
							blockUI.stop(err.respMsg, {
								status: 'isError'
							});
							Dialog.alert({
								content: err.respMsg,
								ok: LANG.BUTTON.OK
							})
						})
						.finally(function () {
							fetchOrgDetails()
								.then(function (res) {
									$scope.data.org = res;
								})
						})
					;
				})
			;
			return deferred.promise;
		}

		function onOrgVaultFileItemClick_secondary(file) {
			viewFile(file);
		}

		function viewFile(file) {
			var url = URL.ORG_FILE_DOWNLOAD
					+ ';' + $.param({
						jsessionid: $scope.session.id
					})
					+ '?' + $.param({
						userSessionId: $scope.session.id,
						id: file.id
					})
				, target = '_system'
				;
			var ref = window.open(url, target);
		}

		function initializeOrgChatClient() {

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


			chatroomId = $scope.data.org.chatRoomId;
			chat_username = $scope.session.userInfo.chatUserName;
			chat_password = $scope.session.userInfo.chatPassword;
			//ChatService.initialize(BOSH_SERVICE_ENDPOINT);
			$scope.joinRoom();
		}

		function getOrgChatNickName() {
			return 'U' + $scope.session.userInfo.id + '-O' + orgId;
		}

		/*----- Chat ----------*/
		var chat_username = null
			, chat_password = null
			, chatroomId = null
			, waitee
			, chat_nickName = getOrgChatNickName()
			;

		var SHOW_TIME_OFFSET_THRESHOLD = 5 * 60 * 60 * 1000
			, TIMESTAMP_UPDATE_TIMER = 30000
			, TIMESTAMP_UPDATE_THROTTLE = 2000
			, PAGE_SIZE = 20
			;

		var self = this;
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
			console.log(chatroomId);
			//DataProvider.resource.ChatMessage.findAll({
			//  where: {
			//    _chatroomId: {
			//      '==': chatroomId
			//    }
			//  },
			//  orderBy: [['timestamp', 'DESC']],
			//  offset: $scope.messageStack.length,
			//  limit: PAGE_SIZE
			//}, {bypassCache: true})
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
				})
				;
		};

		$scope.joinRoom = function () {
			var roomId = chatroomId
				, nickName = chat_nickName
				;
			//console.log("joining:" + chatroomId + " nickname:" + chat_nickName);
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
			var roomId = chatroomId
				, nickName = chat_nickName
				;
			return ChatterService.leaveChatroom(roomId)
		};
		$scope.onInputFieldKeyPress = onInputFieldKeyPress;

		//ChatService.initialize(BOSH_SERVICE_ENDPOINT);
		//$scope.connect();

		function fetchMessagesOlderThan(timestamp, opts) {
			var options = opts || {}
				, deferred = $q.defer()
				, oldestChatId = $scope.messageStackInfo.oldestChatId || 0
				;

			var _params = {
				chatroomId: $scope.data.org.chatRoomId,
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
					console.log($scope.messageStackInfo.oldestChatId);
					angular.forEach(messages, function (msg) {
						$scope.messageStack.unshift(msg);
					});
					deferred.resolve(res);
				})
				.catch(function (res) {
					deferred.reject();
				})
				.finally(function (res) {
				})
			;
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

		function _attachChatListWatcher() {
			self.scopeListeners.mockChatListeners.promise_timeStampWatcher
				= $interval(function () {
				_computeTimeStampOffset();
			}, TIMESTAMP_UPDATE_TIMER);
		}

		function _listenToChatServiceEvents() {
			self.scopeListeners.mockChatListeners.dereg_connecting
				= $scope.$on('ChatService:connecting', function () {
				$scope._connStatus.isInARoom = false;
				showConnectNotification("Connecting...");
			});
		}

		function appendNewMessage(newMessage) {
			//console.log(message);
			if (_.findIndex($scope.messageStack, function (message) {
					return newMessage.id == message.id;
				}) == -1) {
				$scope.messageStack.push(newMessage);
			}
			//$scope.messageStack = _.uniq($scope.messageStack, function(message) {return message.id});
			_updateScroll();

			function _parseSocketMessage(msg) {
				return {}
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
			$timeout(function () {
				$scope._connStatusMessage = msg;
			});
		}

		function onDisconnect() {
			$scope._connActive = false;
			$scope._connStatus.isConnected = false;
			$scope._connStatus.isInARoom = false;
		}

		function onInputFieldKeyPress($event, msg) {
			if ($event.keyCode == 13) {
				//return sendMessage();
			}
		}

		function sendMessage() {
			if ($scope.chatFormModel.newMessage) {
				var msgObj = ChatService.prepareGroupChatMessageJSON($scope.chatFormModel.newMessage
					, $scope.session.userInfo.userFirstName);
				ChatterService.sendMessageToChatroom(chatroomId, msgObj);
				$scope.chatFormModel.newMessage = "";
			}
		}

		/*Org Members functionality */

		function fetchOrgMembers() {
			var _params = {
				orgId: $stateParams.orgId,
				pageSize: 100
			};
			return DataProvider.resource.User.findAll(_params, {
				url: URL.ORG_MEMBERS,
				bypassCache: true
			})
		}

		function findOrgMembers() {
		}

		var _updateScroll = _.throttle(function _updateScroll() {
				self.scrollListElem = mobos.Platform.isIOS()
					? self.scrollListElem || document.getElementById('org_detail_tab_content').parentNode
					: document.body
				;

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