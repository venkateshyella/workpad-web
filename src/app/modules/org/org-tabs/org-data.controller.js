;
(function () {
	"use strict";

	angular.module('app')
		.controller('OrgDataViewController', ['$scope', '$stateParams',
			'blockUI', 'DataProvider',
			'mDialog', '$timeout', 'Lang',
			'Session', 'URL', 'OrgVaultAdmin', 'OrganisationService',
			'FileSystem', 'FileService', '$mdToast','AuditService','CATEGORY_TYPE', OrgDataViewController])


	function OrgDataViewController($scope, $stateParams
		, blockUI, DataProvider, Dialog, $timeout, Lang
		, Session, URL, OrgVaultAdmin, OrganisationService
		, FileSystem, FileService, $mdToast, AuditService, CATEGORY_TYPE) {
		
		$scope.orgFileDownloadUrl= URL.ORG_FILE_DOWNLOAD;

		var LANG = Lang.en.data
			, orgId = $stateParams.orgId;

		$scope.xtras.selectedTabIndex = 5;
		$scope.OrgVaultData = {
			orgVaultFiles: [],
			pgInfo: {
				pageSize: 25,
				currPage: 1
			}
		};
		$scope.state = {
			showAudit: false
		};
		
		$scope.folderView = {
				isEnabled: false,
				folderId : 0,
				folderName: null
		};
		
		$scope.orgTabCtrl.orgModel = DataProvider.resource.Organisation.get(orgId);

		$scope.onOrgVaultFileItemClick_secondary = onOrgVaultFileItemClick_secondary;

		/**
		 * Org Data Audit
		 * */
		$scope.orgAuditCollection = [];
		$scope.orgAuditPageLoader = OrganisationService
			.createOrgVaultAuditListLoader(orgId, $scope.orgAuditCollection)

		$scope.isNextPageAvailable = false;
		$scope.loadingNext = false;
		$scope.loadNext = loadNext;
		$scope.toggleAudit = function (enable) {
			if (!enable) {
				reLoadOrgData();
			}
			$scope.state.showAudit = !!enable;
		};
		
		function reLoadOrgData(){
			$scope.OrgVaultData = {
					orgVaultFiles: [],
					pgInfo: {
						pageSize: 25,
						currPage: 1
					}
				};
			getOrgFiles();
		}

		$scope.orgTabCtrl.orgModel = DataProvider.resource.Organisation.get(orgId);

		if ($scope.orgTabCtrl.orgModel) {
			initOrgFilesView();
		} else {
			$scope.getOrgDetails().then(function () {
				initOrgFilesView();
			});
		}

		$scope.viewFolder = function(folderId, folderName){
			$scope.folderView.isEnabled = true;
			$scope.folderView.folderId = folderId;
			$scope.folderView.folderName = folderName;
			
			getVaultTabMenuList();
			reLoadOrgData();
			
		};
		
		$scope.viewAllData = function(){
			$scope.folderView.isEnabled = false;
			$scope.folderView.folderId = 0;
			$scope.folderView.folderName = null;
			
			getVaultTabMenuList();
			reLoadOrgData();
		};
		
		function initOrgFilesView() {

			getOrgFiles();
			getVaultTabMenuList();
		}

		function getVaultTabMenuList() {

			$scope.orgTabCtrl.optionMenuItems.TAB_VAULT = [];

			var vaultTabMenuItems = [{
				name: "Create Folder",
				action: createFolderClicked,
				isAllowed: !$scope.folderView.isEnabled
			},
			{
				name: "Delete Folders",
				action: deleteFolderClicked,
				isAllowed: !$scope.folderView.isEnabled
			},
			
			{
				name: "Upload File",
				action: uploadFileClicked,
				isAllowed: true
			}, {
				name: "Delete Files",
				action: deleteFileClicked,
				isAllowed: true
			}, {
				name: "Rename Files",
				action: renameFileClicked,
				isAllowed: true
			}, {
				name: "Copy Files",
				action: copyFileClicked,
				isAllowed: true
			},{
				name: "Audit",
				action: auditClicked,
				isAllowed: !$scope.folderView.isEnabled
			}];

			angular.forEach(vaultTabMenuItems, function (menuItem) {
				if (menuItem.isAllowed) {
					$scope.orgTabCtrl.optionMenuItems.TAB_VAULT.push(menuItem);
				}
			});
		}

		var _rawResponse;

		function getOrgFiles() {

			if ($scope.OrgVaultData.orgVaultFiles.length == 0) {

				blockUI.start("Loading WorkSpace Data..", {
					status: 'isLoading'
				});

			}
			var _params = {
				orgId: $stateParams.orgId,
				pageSize: $scope.OrgVaultData.pgInfo.pageSize,
				pageNumber: $scope.OrgVaultData.pgInfo.currPage
			};
			
			if($scope.folderView.isEnabled){
				_params.folderId = $scope.folderView.folderId;
			}

			$scope.orgTabCtrl.orgModel.loadFiles(_params).then(function (res) {
				// $scope.OrgVaultData.orgVaultFiles = res;

				$scope.loadingNext = false;

				angular.forEach(res, function (value, key) {
					$scope.OrgVaultData.orgVaultFiles.push(value);
					$scope.OrgVaultData.orgVaultFiles = _.uniq($scope.OrgVaultData.orgVaultFiles, function (file, key, id) {
						return file.id;
					});
				});
				$timeout();
				checkNextPgAvailability();
			}, null, function (rawResponse) {
				_rawResponse = rawResponse;
			}).catch(function (error) {
				console.log(error);
			}).finally(function () {
				blockUI.stop();
			});
		}

		function checkNextPgAvailability() {
			var totalResults = _rawResponse.resp.paginationMetaData.totalResults;
			if ($scope.OrgVaultData.orgVaultFiles.length < totalResults) {
				$scope.isNextPageAvailable = true;
			} else {
				$scope.isNextPageAvailable = false;
			}
		}

		function loadNext() {
			$scope.loadingNext = true;
			$scope.OrgVaultData.pgInfo.currPage += 1;
			getOrgFiles();
		}

		function onOrgVaultFileItemClick_secondary(file) {

			var url = URL.ORG_FILE_DOWNLOAD + ';' + $.param({
						jsessionid: $scope.session.id
					}) + '?' + $.param({
						userSessionId: $scope.session.id,
						id: file.id
					}),
				target = '_system';
			var ref = window.open(url, target);

		}

		function uploadFileClicked() {

			var _params = {
					catId: $stateParams.orgId,
					catType: CATEGORY_TYPE.ORG
			};
			
			if($scope.folderView.isEnabled){
				_params.folderId = $scope.folderView.folderId;
			}
			
					FileService.showFileUploadConfirmDialog(_params)
						.then(function (fileUploadInfo) {
							var updatedFile = fileUploadInfo.file[0];
							
							var fileParams = {
								fileTitle: updatedFile.lfFileName,
								orgId: $stateParams.orgId,	
								userSessionId: $scope.session.id
							};
							
							if(fileUploadInfo.folderId > 0 && !fileUploadInfo.isNewFolder){
								fileParams.folderId = fileUploadInfo.folderId;
							}
							
							if(fileUploadInfo.isNewFolder){
								fileParams.createFolder = true;
								fileParams.folderName = fileUploadInfo.folderName;
							}
							
							FileService.queueForUpload(updatedFile.lfFileName, updatedFile.lfDataUrl, URL.ORG_FILE_UPLOAD, {
									params: fileParams,
									tagName: "orgVaultFileUpload",
									blockUI: true,
									fileObject: updatedFile.lfFile
								})
								.then(function (res) {
									if (res.isSuccess == true) {
										//getOrgFiles();
										reLoadOrgData();
										showOrgDataOperationsSuccessMsg(res);
									}

								}).catch(function (error) {
							});
						});
		}

		function deleteFileClicked() {

		//	var orgId = $stateParams.orgId;
			
			var delParams = {
					orgId: $stateParams.orgId,
					folderId: -1
			};
			
			if($scope.folderView.isEnabled){
				delParams.folderId = $scope.folderView.folderId;
			}
			
			OrgVaultAdmin.findAndRemoveVaultFolderFiles(delParams)
				.then(function (res) {
					if (res) {

						angular.forEach(res, function (value, key) {
							_.remove($scope.OrgVaultData.orgVaultFiles, {
								id: value.id
							});
						});
						// getOrgFiles();
					}
				}, null, function (rawResponse) {
					if (rawResponse.isSuccess == true) {
						showOrgDataOperationsSuccessMsg(rawResponse);
					}

				})
				.catch(function (err) {
					showOrgDataOperationsErrorMsg(err);
				})
				.finally(function () {
				});

		}

		function renameFileClicked() {
			
			var renParams = {
					orgId: $stateParams.orgId,
					folderId: -1
			};
			
			if($scope.folderView.isEnabled){
				renParams.folderId = $scope.folderView.folderId;
			}

			OrgVaultAdmin.findAndRenameVaultFolderFiles(renParams)
				.then(function (res) {
					console.log(res);
					// getOrgFiles();
				}, null, function (rawResponse) {
					if (rawResponse.isSuccess == true) {
						showOrgDataOperationsSuccessMsg(rawResponse);
					}
				})
				.catch(function (err) {
					showOrgDataOperationsErrorMsg(err);
				})
				.finally(function () {
				});

		}

		function copyFileClicked() {

			var cpParams = {
					catId: $stateParams.orgId,
					catType: CATEGORY_TYPE.ORG
			};
			
			if($scope.folderView.isEnabled){
				cpParams.folderId = $scope.folderView.folderId;
			}
			
			OrgVaultAdmin.findAndCopyVaultFolderFiles(cpParams)
				.then(function (rawResponse) {
					if (rawResponse.isSuccess == true) {
						showOrgDataOperationsSuccessMsg(rawResponse);
					}
				})
				.catch(function (err) {
					showOrgDataOperationsErrorMsg(err);
				})
				.finally(function () {
				});

		}

		function showOrgDataOperationsSuccessMsg(res) {
			var toast = $mdToast.simple()
				.content(res.respMsg)
				.position('bottom right')
				.hideDelay(4000);
			$mdToast.show(toast)
				.then(function (res) {
				});

		}

		function showOrgDataOperationsErrorMsg(err) {
			/*var toast = $mdToast.simple()
			 .content(err)
			 .position('bottom right')
			 .hideDelay(4000);
			 $mdToast.show(toast)
			 .then(function(err) {});*/
			Dialog.alert({
				content: err,
				ok: "Ok"
			});

		}
		function auditClicked() {
			var params = {};
			params.catId = $stateParams.orgId;
			params.catType = CATEGORY_TYPE.ORG;

			blockUI.start("Fetching Audit data");
			AuditService.checkAuditList(URL.VAULT_AUDIT_LIST,params).then(function (res) {
				if (res.results.length > 0) {
					var title = "Data";
					blockUI.stop();
					AuditService.showAudit(URL.VAULT_AUDIT_LIST,params,title, res).then(function (res) {

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
					content: err.message,
					ok: "Ok"
				});
			}).finally(function () {
				blockUI.stop();
			});
		}
		
		
		function createFolderClicked(){
			
			var conParams = {  catId : $stateParams.orgId,
			                  catType : CATEGORY_TYPE.ORG
							};
			FileService.showCreateFolderDialog(conParams).then(function(result){
				reLoadOrgData();
			},function(err){
				if(err.respMsg){
      			  Dialog.alert({
						content: err.respMsg,
						ok: "Ok"
					});
      		    }
			}).catch(function (err) {
				Dialog.alert({
					content: err.message,
					ok: "Ok"
				});
			}).finally(function () {
				blockUI.stop();
			});
		}
		
		
		function deleteFolderClicked() {

			var params = {};
			params.catId = $stateParams.orgId;
			params.catType = CATEGORY_TYPE.ORG;
			
			OrgVaultAdmin.findAndRemoveVaultFolders(params)
				.then(function (res) {
					if (res) {

//						angular.forEach(res, function (value, key) {
//							_.remove($scope.OrgVaultData.orgVaultFiles, {
//								id: value.id
//							});
//						});
						// getOrgFiles();
						
						reLoadOrgData();
						if(res.isSuccess == true){
							showOrgDataOperationsSuccessMsg(res);
						}
					}
				}, null, function (rawResponse) {
					if (rawResponse.isSuccess == true) {
						showOrgDataOperationsSuccessMsg(rawResponse);
					}

				})
				.catch(function (err) {
					showOrgDataOperationsErrorMsg(err);
				})
				.finally(function () {
				});

		}
		
	}

})();