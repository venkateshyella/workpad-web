/**
 * Created by sudhir on 17/9/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.service('GroupVaultAdmin', [
			'$q', 'mDialog', 'blockUI',
			'Connect', 'URL', 'Lang',
			'DataProvider', 'VaultServices', 'FileSystem', 'FileService', 'VaultFilesWorkflow', 'VaultFileRename',
			GroupVaultAdminService
		]);

	function GroupVaultAdminService($q, Dialog, blockUI, Connect, URL, Lang, DataProvider, VaultServices, FileSystem, FileService, VaultFilesWorkflow, VaultFileRename) {

		var LANG = Lang.en.data;
		return {
			findAndRenameVaultFiles: findAndRenameVaultFiles,
			findAndCopyVaultFiles: findAndCopyVaultFiles,
			findAndRemoveVaultFiles: findAndRemoveVaultFiles,
			findAndRemoveVaultFolderFiles: findAndRemoveVaultFolderFiles,
			findAndRenameVaultFolderFiles: findAndRenameVaultFolderFiles,
			findAndCopyVaultFolderFiles: findAndCopyVaultFolderFiles
		};

		function getGroupFilesList(groupId) {
			blockUI.start("Loading Room Data ", {
				status: 'isLoading'
			});
			return VaultServices.FetchTaskVaultFiles(groupId)
				.then(function (filesList) {
					return (filesList);

				}).catch(function (error) {
					blockUI.stop(error.respMsg, {
						status: 'isError',
						action: 'Ok'
					});
				}).finally(function () {
					blockUI.stop();
				});

		}


		function findAndCopyVaultFiles(groupId) {
			var deferred = $q.defer();
			blockUI.start(LANG.GROUP.LOADING_MSG.FETCHING_OWNER_FILES);
			var groupModel = DataProvider.resource.Group.get(groupId);
			groupModel.loadFiles({
					sendToAll: true
				}, {
					bypassCache: true
				})
				.then(function (vaultFiles) {
					if (vaultFiles && vaultFiles.length > 0) {
						blockUI.stop();
						VaultFilesWorkflow.selectAndCopyFiles(vaultFiles,
							function (selectedFiles, copyDestination) {
								var src = {
										catId: groupModel.id,
										catType: 2
									},
									dst = {
										catType: copyDestination.catType,
										catId: copyDestination.id
									};
								blockUI.start(LANG.VAULT.LOADING_MSG.COPY_IN_PROGRESS);
								return VaultServices.copyFiles(selectedFiles, src, dst, {
										url: URL.VAULT_FILE_COPY
									})
									.then(function (res) {
										blockUI.stop();
										deferred.resolve(res);
									});
							},
							fetchGroupCopyDestination, {
								title: LANG.VAULT.LABEL.TITLE_COPY_FILES,
								actionButtonText: LANG.VAULT.BUTTON.COPY,
								cancelButtonText: LANG.BUTTON.CANCEL,
								placeholder_select_destination: LANG.VAULT.LABEL.PLACEHOLDER_SELECT_DESTINATION_VAULT
							});
					} else {
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
				});
			return deferred.promise;

			function fetchGroupCopyDestination() {
				return _fetchCopyDestinationList(groupModel.id);
			}
		}
		
		
		function findAndCopyVaultFolderFiles(params) {
			var deferred = $q.defer();
			blockUI.start(LANG.GROUP.LOADING_MSG.FETCHING_OWNER_FILES);
			var fileModel = DataProvider.resource.File;
			fileModel.fetchFilesList(params)
				.then(function (vaultFiles) {
					if (vaultFiles && vaultFiles.length > 0) {
						blockUI.stop();
						VaultFilesWorkflow.selectAndCopyFiles(vaultFiles,
							function (selectedFiles, copyDestination) {
								var src = {
										catId: params.catId,
										catType: params.catType
									},
									dst = {
										catType: copyDestination.catType,
										catId: copyDestination.id
									};
								blockUI.start(LANG.VAULT.LOADING_MSG.COPY_IN_PROGRESS);
								return VaultServices.copyFiles(selectedFiles, src, dst, {
										url: URL.VAULT_FILE_COPY
									})
									.then(function (res) {
										blockUI.stop();
										deferred.resolve(res);
									});
							},
							fetchGroupCopyDestination, {
								title: LANG.VAULT.LABEL.TITLE_COPY_FILES,
								actionButtonText: LANG.VAULT.BUTTON.COPY,
								cancelButtonText: LANG.BUTTON.CANCEL,
								placeholder_select_destination: LANG.VAULT.LABEL.PLACEHOLDER_SELECT_DESTINATION_VAULT
							});
					} else {
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
				});
			return deferred.promise;

			function fetchGroupCopyDestination() {
				return _fetchCopyDestinationList(params.catId);
			}
		}

		function _fetchCopyDestinationList(groupId) {
			var groupModel = DataProvider.resource.Group.get(groupId);
			return groupModel.fetchVaultFileCopyDestinations()
				.then(function (res) {
					return VaultServices.prepCopyDestinationResults(res);
				})
				.catch(function (err) {
					return err;
				})
		}

		function fetchVaultFilesWithAdminRights(groupId) {

			return DataProvider.resource.File.findAll({
					groupId: groupId
				}, {
					url: URL.GROUP_VAULT_OWNER_FILE_LIST,
					bypassCache: true
				})
				.then(function (files) {
					return files;
				});
		}
		
		function fetchVaultFolderFilesWithAdminRights(params) {
			var _params = {};
		    _params.groupId = params.groupId;
		    if(params.folderId && params.folderId > 0){
		    	_params.folderId = params.folderId;
		    }
			return DataProvider.resource.File.findAll(_params, {
					url: URL.GROUP_VAULT_OWNER_FILE_LIST,
					bypassCache: true
				})
				.then(function (files) {
					return files;
				});
		}

		function findAndRemoveVaultFiles(groupId) {
			var fileList = [];
			var deferred = $q.defer();
			blockUI.start(LANG.ORGANISATION.LOADING_MSG.FETCHING_OWNER_FILES);
			fetchVaultFilesWithAdminRights(groupId)
				.then(function (files) {
					fileList = files;
					if (files && files.length > 0) {
						blockUI.stop();
						VaultFilesWorkflow.selectAndExecuteActionOnFiles(fileList,
							function (fileList) {
								//var deferred = $q.defer();
								blockUI.start(LANG.VAULT.LOADING_MSG.DELETING_FILES);
								var groupModel = DataProvider.resource.Group.get(groupId);
								groupModel.deleteFiles(fileList)
									.then(function (res) {

										deferred.resolve(res);
									}, null, function (rawResponse) {
										deferred.notify(rawResponse);
									})
									.catch(function (err) {
										deferred.reject(err)
									})
									.finally(function () {
										blockUI.stop();
									});
								// return deferred.promise;
							}, {
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
					// deferred.resolve(files);
				})
				.catch(function (err) {
					blockUI.stop(err.respMsg, {
						status: 'isError',
						action: LANG.BUTTON.OK
					});
					Dialog.alert(err.respMsg);
					deferred.reject(err);
				})
			return deferred.promise;
		}
		function findAndRemoveVaultFolderFiles(params) {
			var fileList = [];
			var deferred = $q.defer();
			blockUI.start(LANG.ORGANISATION.LOADING_MSG.FETCHING_OWNER_FILES);
			fetchVaultFolderFilesWithAdminRights(params)
				.then(function (files) {
					fileList = files;
					if (files && files.length > 0) {
						blockUI.stop();
						VaultFilesWorkflow.selectAndExecuteActionOnFiles(fileList,
							function (fileList) {
								//var deferred = $q.defer();
								blockUI.start(LANG.VAULT.LOADING_MSG.DELETING_FILES);
								var groupModel = DataProvider.resource.Group.get(params.groupId);
								groupModel.deleteFiles(fileList)
									.then(function (res) {

										deferred.resolve(res);
									}, null, function (rawResponse) {
										deferred.notify(rawResponse);
									})
									.catch(function (err) {
										deferred.reject(err)
									})
									.finally(function () {
										blockUI.stop();
									});
								// return deferred.promise;
							}, {
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
					// deferred.resolve(files);
				})
				.catch(function (err) {
					blockUI.stop(err.respMsg, {
						status: 'isError',
						action: LANG.BUTTON.OK
					});
					Dialog.alert(err.respMsg);
					deferred.reject(err);
				})
			return deferred.promise;
		}
		function findAndRenameVaultFiles(groupId) {
			blockUI.start(LANG.ORGANISATION.LOADING_MSG.FETCHING_OWNER_FILES);
			var deferred = $q.defer();
			fetchVaultFilesWithAdminRights(groupId)
				.then(function (files) {
					if (files && files.length > 0) {
						blockUI.stop();
						VaultFileRename.renameFiles(
							files,
							function (updatedFiles) {
								var deferred = $q.defer();
								blockUI.start(LANG.VAULT.LOADING_MSG.RENAME_FILES);
								var groupModel = DataProvider.resource.Group.get(groupId);
								groupModel.updateFiles(DataProvider.pluckAttrArrayProperties(updatedFiles, ['id', 'fileDisplayName']), {
										url: URL.VAULT_FILE_RENAME
									})
									.then(function (res) {
										deferred.resolve(res);
									}, null, function (rawResponse) {

										deferred.notify(rawResponse);

										console.log(rawResponse);

									})
									.catch(function (err) {
										deferred.reject(err);
									})
									.finally(function () {
										blockUI.stop();
									});
								return deferred.promise;
							}, {
								title: "Rename Files",
								actionButtonText: LANG.BUTTON.UPDATE,
								cancelButtonText: LANG.BUTTON.CANCEL
							}
							)
							.then(function (res) {
								deferred.resolve(files);
							}, null, function (rawResponse) {
								deferred.notify(rawResponse);
							});
					} else {
						blockUI.stop(LANG.VAULT.LABEL.NO_FILES_FOUND, {
							status: 'isSuccess',
							action: LANG.BUTTON.OK
						});
					}


				})
				.catch(function (err) {
					blockUI.stop(err.respMsg, {
						status: 'isError',
						action: LANG.BUTTON.OK
					});
					deferred.reject(err);
				});
			return deferred.promise;
		}
		
		function findAndRenameVaultFolderFiles(params) {
			blockUI.start(LANG.ORGANISATION.LOADING_MSG.FETCHING_OWNER_FILES);
			var deferred = $q.defer();
			fetchVaultFolderFilesWithAdminRights(params)
				.then(function (files) {
					if (files && files.length > 0) {
						blockUI.stop();
						VaultFileRename.renameFiles(
							files,
							function (updatedFiles) {
								var deferred = $q.defer();
								blockUI.start(LANG.VAULT.LOADING_MSG.RENAME_FILES);
								var groupModel = DataProvider.resource.Group.get(params.groupId);
								groupModel.updateFiles(DataProvider.pluckAttrArrayProperties(updatedFiles, ['id', 'fileDisplayName']), {
										url: URL.VAULT_FILE_RENAME
									})
									.then(function (res) {
										deferred.resolve(res);
									}, null, function (rawResponse) {

										deferred.notify(rawResponse);

										console.log(rawResponse);

									})
									.catch(function (err) {
										deferred.reject(err);
									})
									.finally(function () {
										blockUI.stop();
									});
								return deferred.promise;
							}, {
								title: "Rename Files",
								actionButtonText: LANG.BUTTON.UPDATE,
								cancelButtonText: LANG.BUTTON.CANCEL
							}
							)
							.then(function (res) {
								deferred.resolve(files);
							}, null, function (rawResponse) {
								deferred.notify(rawResponse);
							});
					} else {
						blockUI.stop(LANG.VAULT.LABEL.NO_FILES_FOUND, {
							status: 'isSuccess',
							action: LANG.BUTTON.OK
						});
					}


				})
				.catch(function (err) {
					blockUI.stop(err.respMsg, {
						status: 'isError',
						action: LANG.BUTTON.OK
					});
					deferred.reject(err);
				});
			return deferred.promise;
		}

	}

})();
