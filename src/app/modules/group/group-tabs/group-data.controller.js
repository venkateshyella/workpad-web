;
(function () {
	"use strict";

	angular.module('app')
		.controller('GroupDataViewController', ['$scope', '$stateParams', 'blockUI',
			'DataProvider', 'mDialog', '$timeout',
			'Lang', 'Session', 'URL', 'GroupVaultAdmin', 'GroupService',
			'FileSystem', 'FileService', '$mdToast','AuditService','CATEGORY_TYPE','OrgVaultAdmin', GroupDataViewController])


	function GroupDataViewController($scope, $stateParams, blockUI
		, DataProvider, Dialog, $timeout
		, Lang, Session, URL, GroupVaultAdmin, GroupService
		, FileSystem, FileService, $mdToast, AuditService, CATEGORY_TYPE,OrgVaultAdmin) {
		
		$scope.groupFileDownloadUrl = URL.GROUP_FILE_DOWNLOAD;
		var LANG = Lang.en.data;
		var groupId = $stateParams.groupId;
		
		if(!$scope.groupTabCtrl.groupModel.isSupportGroup){
        	$scope.xtras.selectedTabIndex = 5;
        }else{
        	$scope.xtras.selectedTabIndex = 4;
        }

		$scope.GroupVaultData = {
			groupVaultFiles: [],
			pgInfo: {
				pageSize: 25,
				currPage: 1
			}
		};
		
		$scope.isNextPageAvailable = false;
		$scope.loadingNext = false;
		$scope.loadNext = loadNext;
		
		$scope.folderView = {
				isEnabled: false,
				folderId : 0,
				folderName: null
		};
		
		/**
		 * Group Data Audit
		 * */
		$scope.groupAuditCollection = [];
		$scope.groupAuditPageLoader = GroupService
			.createGroupVaultAuditListLoader(groupId, $scope.groupAuditCollection);

		$scope.state = {
			showAudit: false
		};

		$scope.onGroupVaultFileItemClick_secondary = onGroupVaultFileItemClick_secondary;
		
		$scope.toggleAudit = function (enable) {
			if (!enable) {
				reLoadGroupData();
			}
			$scope.state.showAudit = !!enable;
		};
		
		function checkNextPgAvailability() {
			var totalResults = _rawResponse.resp.paginationMetaData.totalResults;
			if ($scope.GroupVaultData.groupVaultFiles.length < totalResults) {
				$scope.isNextPageAvailable = true;
			} else {
				$scope.isNextPageAvailable = false;
			}
		}

		function loadNext() {
			$scope.loadingNext = true;
			$scope.GroupVaultData.pgInfo.currPage += 1;
			getGroupFiles();
		}
		
		function reLoadGroupData(){
			$scope.GroupVaultData = {
					groupVaultFiles: [],
					pgInfo: {
						pageSize: 25,
						currPage: 1
					}
				};
			getGroupFiles();
		}
		
		$scope.viewFolder = function(folderId, folderName){
			$scope.folderView.isEnabled = true;
			$scope.folderView.folderId = folderId;
			$scope.folderView.folderName = folderName;
			
			getVaultTabMenuList();
			reLoadGroupData();
			
		};
		
		$scope.viewAllData = function(){
			$scope.folderView.isEnabled = false;
			$scope.folderView.folderId = 0;
			$scope.folderView.folderName = null;
			
			getVaultTabMenuList();
			reLoadGroupData();
		};
		
		$scope.groupTabCtrl.groupModel = DataProvider.resource.Group.get(groupId);

		if ($scope.groupTabCtrl.groupModel && $scope.groupTabCtrl.orgModel) {
			initGroupDataView();
		} else {

			$scope.getGroupModelAndOrgModel().then(function () {
				initGroupDataView();
			});

		}

		function initGroupDataView() {
			getGroupFiles();
			getVaultTabMenuList();
		}

		function getVaultTabMenuList() {

			$scope.groupTabCtrl.optionMenuItems.TAB_VAULT = [];

			var vaultTabMenuItems = [{
				name: "Create Folder",
				action: createFolderClicked,
				isAllowed: !$scope.isVisitor && !$scope.folderView.isEnabled
			},{
				name: "Delete Folders",
				action: deleteFolderClicked,
				isAllowed: !$scope.isVisitor && !$scope.folderView.isEnabled
			},{
				name: "Upload File",
				action: uploadFileClicked,
				isAllowed: !$scope.isVisitor
			}, {
				name: "Delete Files",
				action: deleteFileClicked,
				isAllowed: !$scope.isVisitor
			}, {
				name: "Rename Files",
				action: renameFileClicked,
				isAllowed: !$scope.isVisitor
			}, {
				name: "Copy Files",
				action: copyFileClicked,
				isAllowed: !$scope.isVisitor
			},{
				name: "Audit",
				action: auditClicked,
				isAllowed: !$scope.folderView.isEnabled
			}];

			angular.forEach(vaultTabMenuItems, function (menuItem) {
				if (menuItem.isAllowed) {
					$scope.groupTabCtrl.optionMenuItems.TAB_VAULT.push(menuItem);
				}
			});
		}
		
		var _rawResponse;
		function getGroupFiles() {
			
			if ($scope.GroupVaultData.groupVaultFiles.length == 0) {
				blockUI.start("Loading Room Data..", {
					status: 'isLoading'
				});
			}
			
			var _params = {
				groupId: $stateParams.groupId,
				pageSize: $scope.GroupVaultData.pgInfo.pageSize,
				pageNumber: $scope.GroupVaultData.pgInfo.currPage
			};
			
			if($scope.folderView.isEnabled){
				_params.folderId = $scope.folderView.folderId;
			}
			
			$scope.groupTabCtrl.groupModel.loadFiles(_params).then(function (res) {
				$scope.loadingNext = false;
//				$scope.GroupVaultData.groupVaultFiles.push(res);
				
				angular.forEach(res, function (value, key) {
					$scope.GroupVaultData.groupVaultFiles.push(value);
					$scope.GroupVaultData.groupVaultFiles = _.uniq($scope.GroupVaultData.groupVaultFiles, function (file, key, id) {
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

		function onGroupVaultFileItemClick_secondary(file) {

			var url = URL.GROUP_FILE_DOWNLOAD + ';' + $.param({
						jsessionid: $scope.session.id
					}) + '?' + $.param({
						userSessionId: $scope.session.id,
						id: file.id
					}),
				target = '_system';
			var ref = window.open(url, target);

		}

		function uploadFileClicked() {

			var conParams = { catId : groupId,
					catType : CATEGORY_TYPE.GROUP
			};

			if($scope.folderView.isEnabled){
				conParams.folderId = $scope.folderView.folderId;
			}
			
			FileService.showFileUploadConfirmDialog(conParams)
			.then(function (fileUploadInfo) {
				var updatedFile = fileUploadInfo.file[0];

				var fileParams = {
						fileTitle: updatedFile.lfFileName,
						groupId: groupId,	
						userSessionId: $scope.session.id
				};

				if(fileUploadInfo.folderId > 0 && !fileUploadInfo.isNewFolder){
					fileParams.folderId = fileUploadInfo.folderId;
				}

				if(fileUploadInfo.isNewFolder){
					fileParams.createFolder = true;
					fileParams.folderName = fileUploadInfo.folderName;
				}
				FileService.queueForUpload(updatedFile.lfFileName, updatedFile.lfDataUrl, URL.GROUP_FILE_UPLOAD, {
					params: fileParams,
					tagName: "groupVaultFileUpload",
					blockUI: true,
					fileObject: updatedFile.lfFile
				})
				.then(function (res) {
					if (res.isSuccess == true) {
						//getGroupFiles();
						reLoadGroupData();
						showGroupDataOperationsSuccessMsg(res);
					}

				}).catch(function (error) {
					console.log(error);
				});
			});
		}

		function deleteFileClicked() {

			var delParams = {
					groupId: $stateParams.groupId,
					folderId: -1
			};
			
			if($scope.folderView.isEnabled){
				delParams.folderId = $scope.folderView.folderId;
			}
			GroupVaultAdmin.findAndRemoveVaultFolderFiles(delParams)
				.then(function (res) {
					if (res) {

						angular.forEach(res, function (value, key) {
							_.remove($scope.GroupVaultData.groupVaultFiles, {
								id: value.id
							});
						});
						// getGroupFiles();
					}
				}, null, function (rawResponse) {
					if (rawResponse.isSuccess == true) {
						showGroupDataOperationsSuccessMsg(rawResponse);
					}

				})
				.catch(function (err) {
					
				})
				.finally(function () {
				});

		}

		function renameFileClicked() {

			var delParams = {
					groupId: $stateParams.groupId,
					folderId: -1
			};
			
			if($scope.folderView.isEnabled){
				delParams.folderId = $scope.folderView.folderId;
			}

			GroupVaultAdmin.findAndRenameVaultFolderFiles(delParams)
				.then(function (res) {
					console.log(res);
				}, null, function (rawResponse) {
					if (rawResponse.isSuccess == true) {
						showGroupDataOperationsSuccessMsg(rawResponse);
					}
				})
				.catch(function (err) {
					console.log(err)
				})
				.finally(function () {
				});

		}

		function copyFileClicked() {

			var cpParams = {
					catId: $stateParams.groupId,
					catType: CATEGORY_TYPE.GROUP
			};
			
			if($scope.folderView.isEnabled){
				cpParams.folderId = $scope.folderView.folderId;
			}
			GroupVaultAdmin.findAndCopyVaultFolderFiles(cpParams)
				.then(function (rawResponse) {
					if (rawResponse.isSuccess == true) {
						showGroupDataOperationsSuccessMsg(rawResponse);
					}
				})
				.catch(function (err) {
					console.log(err)
				})
				.finally(function () {
				});

		}

		function showGroupDataOperationsSuccessMsg(res) {

			var toast = $mdToast.simple()
				.content(res.respMsg)
				.position('bottom right');
//				.hideDelay(4000);
			$mdToast.show(toast)
				.then(function (res) {
				});

		}
		
		function auditClicked() {
			var params = {};
			params.catId = $stateParams.groupId;
			params.catType = CATEGORY_TYPE.GROUP;

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
		
		function createFolderClicked() {
			var conParams = { catId : groupId,
					          catType : CATEGORY_TYPE.GROUP
					        };
			FileService.showCreateFolderDialog(conParams).then(function(result){
				reLoadGroupData();
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
			params.catId = groupId;
			params.catType = CATEGORY_TYPE.GROUP;
			
			OrgVaultAdmin.findAndRemoveVaultFolders(params)
			.then(function (res) {
				if (res) {
					reLoadGroupData();
				}
				
				if(res.isSuccess == true){
					showGroupDataOperationsSuccessMsg(res);
				}
				
			}, null, function (rawResponse) {
				if (rawResponse.isSuccess == true) {
					showGroupDataOperationsSuccessMsg(rawResponse);
				}

			})
			.catch(function (err) {
				Dialog.alert({
					content: err.message,
					ok: "Ok"
				});
			})
			.finally(function () {
			});
		}
	}


})();