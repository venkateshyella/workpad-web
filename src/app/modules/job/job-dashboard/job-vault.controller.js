;
(function () {
	"use strict";

	angular.module('app')
		.controller('JobVaultViewController', ['$scope', '$stateParams',
			'blockUI', 'DataProvider', 'mDialog', '$timeout',
			'Lang', 'Session', 'VaultServices',
			'FileSystem', 'JobVaultAdmin', 'JobService',
			'FileService', '$mdToast','URL','CATEGORY_TYPE','AuditService', JobVaultViewController])


	function JobVaultViewController($scope, $stateParams
		, blockUI, DataProvider, Dialog, $timeout
		, Lang, Session, VaultServices
		, FileSystem, JobVaultAdmin, JobService
		, FileService, $mdToast,URL,CATEGORY_TYPE,AuditService) {

		var jobId = $stateParams.jobId;
		
		$scope.JobPageInfo = {
					pageSize: 25,
					currPage: 1
			};
		
		$scope.folderView = {
				isEnabled: false,
				folderId : 0,
				folderName: null
		};
		
		$scope.filesList = [];
			
		$scope.isNextPageAvailable = false;
		$scope.loadingNext = false;
		$scope.loadNext = loadNext;
		

		$scope.jobFileDownloadURL = URL.JOB_FILE_DOWNLOAD;
		
		/**
		 * Job data audit
		 * */
		$scope.tab_curr = 'TAB_VAULT';
		$scope.state = {
			showAudit: false
		};
		$scope.toggleAudit = function (enable) {
			if (!enable) {
				reLoadJobData();
			}
			$scope.state.showAudit = !!enable;
		};

		$scope.jobAuditCollection = [];
		$scope.jobAuditPageLoader = JobService
			.createJobVaultAuditListLoader(jobId, $scope.jobAuditCollection);

		$scope.fetchJobDetails()
			.then(function () {
				getDataMenuList();
			});
		$scope.invokeFileChooserForJob = invokeFileChooser;
		$scope.onJobVaultFileItemClick_secondary = onJobVaultFileItemClick_secondary;

		getJobFilesList();

		function fetchJobDetails() {
			return DataProvider.resource.Job.find(jobId, {
					bypassCache: true,
					files: true,
					contributors: true,
					tasks: true
				})
				.then(function (jobModel) {
					$scope.JobTabCtrl.jobModel = jobModel;
					$scope.data.vaultInfo = jobModel.vaultInfo;
					$scope.JobTabCtrl.jobModel.loadForms({pageSize: 25, pageNumber : 1});
					return jobModel;
				})
		}

		$scope.viewAllData = function(){
			$scope.folderView.isEnabled = false;
			$scope.folderView.folderId = 0;
			$scope.folderView.folderName = null;
			
			getDataMenuList();
			reLoadJobData();
		};
		
		function reLoadJobData(){
			$scope.filesList = [];
			$scope.JobPageInfo = {
					pageSize: 25,
					currPage: 1
			};
			getJobFilesList();
		}
		
		$scope.viewFolder = function(folderId, folderName){
			$scope.folderView.isEnabled = true;
			$scope.folderView.folderId = folderId;
			$scope.folderView.folderName = folderName;
			
			getDataMenuList();
			reLoadJobData();
			
		};
		
		var _rawResponse;
		
		function getJobFilesList() {
			/* VaultServices.FetchJobVaultFiles($stateParams.jobId).then(function(res) {

			 $scope.filesList = res;

			 // --end Sudhir edit------
			 }
			 }).catch(function(err) {
			 console.log(err);
			 });*/

			blockUI.start("Loading Job Vault ", {
				status: 'isLoading'
			});
			
//			$scope.filesList = DataProvider.resource.File.filter({
//				where: {
//					jobId: parseInt($stateParams.jobId)
//				}
//			});
			
			var _params = {
					pageSize: $scope.JobPageInfo.pageSize,
					pageNumber: $scope.JobPageInfo.currPage
				};
			
			if($scope.folderView.isEnabled){
				_params.folderId = $scope.folderView.folderId;
			}
			
			VaultServices.FetchJobVaultFiles(jobId,_params)
				.then(function (filesList) {
//					$scope.filesList.push(filesList);
					$scope.loadingNext = false;
					
					angular.forEach(filesList, function (value, key) {
						$scope.filesList.push(value);
						$scope.filesList = _.uniq($scope.filesList, function (file, key, id) {
							return file.id;
						});
					});
					$timeout();
					checkNextPgAvailability()
				}, null, function (rawResponse) {
					_rawResponse = rawResponse;
				})
				.catch(function (error) {
					blockUI.stop(error.respMsg, {
						status: 'isError',
						action: 'Ok'
					});
				})
				.finally(function () {
					blockUI.stop();
				});

		}
		
		function checkNextPgAvailability() {
			var totalResults = _rawResponse.resp.paginationMetaData.totalResults;
			if ($scope.filesList.length < totalResults) {
				$scope.isNextPageAvailable = true;
			} else {
				$scope.isNextPageAvailable = false;
			}
		}

		function loadNext() {
			$scope.loadingNext = true;
			$scope.JobPageInfo.currPage += 1;
			getJobFilesList();
		}
		

		function getDataMenuList() {

			$scope.JobTabCtrl.optionMenuItems.TAB_VAULT = [];

			var dataMenuItems = [{
				name: "Create Folder",
				action: createFolderClicked,
				isAllowed: !$scope.JobTabCtrl.jobModel.isClosed() && !$scope.folderView.isEnabled
			},{
				name: "Delete Folders",
				action: deleteFolderClicked,
				isAllowed: !$scope.JobTabCtrl.jobModel.isClosed() && !$scope.folderView.isEnabled
			},{
				name: "Upload File",
				action: invokeFileChooser,
				isAllowed: !$scope.JobTabCtrl.jobModel.isClosed()
			}, {
				name: "Delete Files",
				action: deleteFileClicked,
				isAllowed: !$scope.JobTabCtrl.jobModel.isClosed()
			}, {
				name: "Rename Files",
				action: renameFileClicked,
				isAllowed: !$scope.JobTabCtrl.jobModel.isClosed()
			}, {
				name: "Copy Files",
				action: copyFileClicked,
				isAllowed: !$scope.JobTabCtrl.jobModel.isClosed()
			},{
				name: "Audit",
				action: auditClicked,
				isAllowed: !$scope.folderView.isEnabled
			}];

			angular.forEach(dataMenuItems, function (menuItem) {
				if (menuItem.isAllowed) {
					$scope.JobTabCtrl.optionMenuItems.TAB_VAULT.push(menuItem);
				}
			});
		}
		
		function createFolderClicked() {
			var conParams = { 
					  catId : $stateParams.jobId,
			          catType : CATEGORY_TYPE.JOB
			        };
			FileService.showCreateFolderDialog(conParams).then(function(result){
				reLoadJobData();
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
			params.catId = $stateParams.jobId;
			params.catType = CATEGORY_TYPE.JOB;
			
			JobVaultAdmin.findAndRemoveVaultFolders(params)
			.then(function (res) {
				if (res) {
					reLoadJobData();
				}
				
				if(res.isSuccess == true){
					showJobDataOperationsSuccessMsg(res);
				}
				
			}, null, function (rawResponse) {
				if (rawResponse.isSuccess == true) {
					showJobDataOperationsSuccessMsg(rawResponse);
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
		
		function auditClicked() {
			var params = {};
			params.catId = $stateParams.jobId;
			params.catType = CATEGORY_TYPE.JOB;

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

		function deleteFileClicked() {
			var delParams = {
					jobId: $stateParams.jobId,
					folderId: -1
			};
			if($scope.folderView.isEnabled){
				delParams.folderId = $scope.folderView.folderId;
			}
			JobVaultAdmin.findAndRemoveVaultFolderFiles(delParams)
				.then(function (res) {
					if (res) {
						angular.forEach(res, function (file, key) {
							_.remove($scope.filesList, {
								id: file.id
							});
						});

					}
				}, null, function (rawResponse) {
					if (rawResponse.isSuccess == true) {
						showJobDataOperationsSuccessMsg(rawResponse);
					}

				})
				.catch(function (err) {
					console.log(err)
				})
				.finally(function () {
				});

		}

		function renameFileClicked() {
			
			var delParams = {
					jobId: $stateParams.jobId,
					folderId: -1
			};
			
			if($scope.folderView.isEnabled){
				delParams.folderId = $scope.folderView.folderId;
			}

			JobVaultAdmin.findAndRenameVaultFiles(delParams)
				.then(function (res) {
					console.log(res);
				}, null, function (rawResponse) {
					if (rawResponse.isSuccess == true) {
						showJobDataOperationsSuccessMsg(rawResponse);
					}
				})
				.catch(function (err) {
					console.log(err)
				})
				.finally(function () {
				});

		}

		function copyFileClicked() {
			
			var params = {};
			params.catId = $stateParams.jobId;
			params.catType = CATEGORY_TYPE.JOB;
			
			if($scope.folderView.isEnabled){
				params.folderId = $scope.folderView.folderId;
			}
			
			JobVaultAdmin.findAndCopyVaultFiles(params)
				.then(function (rawResponse) {

					if (rawResponse.isSuccess == true) {
						showJobDataOperationsSuccessMsg(rawResponse);
					}

				})
				.catch(function (err) {
					console.log(err)
				})
				.finally(function () {
				});

		}

		function showJobDataOperationsSuccessMsg(res) {

			var toast = $mdToast.simple()
				.content(res.respMsg)
				.position('bottom right');
//				.hideDelay(4000);
			$mdToast.show(toast)
				.then(function (res) {
				});

		}

		
		function invokeFileChooser() {
			
			var conParams = { 
					catId : $stateParams.jobId,
					catType : CATEGORY_TYPE.JOB
			};

			if($scope.folderView.isEnabled){
				conParams.folderId = $scope.folderView.folderId;
			}
			
			FileService.showFileUploadConfirmDialog(conParams)
			.then(function (fileUploadInfo) {
				var updatedFile = fileUploadInfo.file[0];
				var fileParams = {
						fileTitle: updatedFile.lfFileName,
						jobId: parseInt($stateParams.jobId),	
						userSessionId: $scope.session.id
				};

				if(fileUploadInfo.folderId > 0 && !fileUploadInfo.isNewFolder){
					fileParams.folderId = fileUploadInfo.folderId;
				}

				if(fileUploadInfo.isNewFolder){
					fileParams.createFolder = true;
					fileParams.folderName = fileUploadInfo.folderName;
				}
					
				FileService.queueForUpload(updatedFile.lfFileName, updatedFile.lfDataUrl, URL.JOB_FILE_UPLOAD, {
							params:fileParams,
							tagName: "jobVaultFileUpload",
							blockUI: true,
							fileObject: updatedFile.lfFile
						})
						.then(function (res) {
							if (res.isSuccess == true) {
								reLoadJobData();
								//getJobFilesList();
								fetchJobDetails();
								showJobDataOperationsSuccessMsg(res);
							}
						}).catch(function (error) {
						});
			});				
}
/*
		
		function invokeFileChooser() {

			if ($scope.inProgress) return;
			$scope.uploadDone = false;
			$scope.error = null;

			FileSystem.pickFile()
				.then(function (file) {
					FileService.showFilePickerConfirmDialog(file)
						.then(function (updatedFile) {
							FileService.queueForUpload(updatedFile.name, updatedFile.dataUrl, URL.JOB_FILE_UPLOAD, {
									params: {
										fileTitle: updatedFile.displayName,
										jobId: parseInt($stateParams.jobId),
										userSessionId: $scope.session.id
									},
									tagName: "jobVaultFileUpload",
									blockUI: true,
									fileObject: updatedFile
								})
								.then(function (res) {
									// refresh();
									var serverFileObject = res.resp;

									getJobFilesList();
									fetchJobDetails();

									if (res.isSuccess == true) {
										showJobDataOperationsSuccessMsg(res);
									}

									//FileService.showFilePermissionsManager(serverFileObject,
									//  function (paginationRequestData) {
									//      var paginationRequestData = paginationRequestData || {
									//              pageSize: 25,
									//              pageNumber: 1
									//          };
									//      return Connect.get(URL.JOB_GET_FILE_PERMISSIONS, {
									//          jobId: parseInt($stateParams.jobId),
									//          fileId: serverFileObject.id,
									//          pageSize: paginationRequestData.pageSize,
									//          pageNumber: paginationRequestData.pageNumber
									//      })
									//  },
									//  function (permissions) {
									//      var permissionsUpdateData = preparePermissionUpdateData(permissions);
									//      return Connect.post(URL.JOB_PUT_FILE_PERMISSIONS, permissionsUpdateData);
									//  }, {
									//      fileContextDisplayName: $scope.jobModel.title,
									//      forcePermissionUpdate: true
									//  })
									//  .finally(function () {
									//      getJobFilesList();
									//      fetchJobDetails();
									//  });
								});
						});
				})
				.catch(function (reject) {
					console.log(reject);
				})
		};
		
		*/

		/* function onJobVaultFileItemLongPress(file, $event) {
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
		 .then(function(select) {
		 switch (select.value) {
		 case 'delete_file':
		 askAndDeleteFile(file)
		 .then(function(res) {
		 //refresh();

		 if (res.respMsg == "success") {
		 getJobFilesList();

		 fetchJobDetails();
		 }
		 });
		 break;
		 }
		 })
		 .finally(function() {
		 $scope.longPressActive = false;
		 });
		 }*/

		function askAndDeleteFile(file) {
			var deferred = $q.defer();
			Dialog.confirm({
					content: 'Delete "' + file.fileDisplayName + '"',
					ok: "Delete",
					cancel: "Cancel"
				})
				.then(function () {

					blockUI.start("Deleting file..");

					Connect.get(URL.JOB_FILE_DELETE, {
							id: file.id
						})
						.then(function (res) {
							blockUI.stop(res.respMsg, {
								status: 'isSuccess'
							});

							DataProvider.resource.File.destroy(file.id, {}).then(function () {

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
							/* fetchJobDetails()
							 .then(function(res) {
							 $scope.data.job = res;
							 })*/
						});
				});
			return deferred.promise;
		}

		function fetchJobVaultFiles() {
			var jobId = parseInt($stateParams.jobId);
			return VaultServices.FetchOrgVaultFiles(jobId, {
					bypassCache: true
				})
				.then(function (res) {
					var vaultFiles = res;
					return fetchJobDetails()
						.then(function (jobData) {
							/* $timeout(function () {
							 $scope.data.vaultInfo = jobData.vaultInfo;
							 }, 100);*/

							$scope.data.vaultInfo = jobData.vaultInfo;

							$timeout(function () {
							});

							return vaultFiles;
						});
				})
				.finally(function () {
				});
		}

		function onJobVaultFileItemClick_secondary(file) {
			viewFile(file);
		}

		function viewFile(file) {
			var url = URL.JOB_FILE_DOWNLOAD + ';' + $.param({
						jsessionid: $scope.session.id
					}) + '?' + $.param({
						userSessionId: $scope.session.id,
						id: file.id
					}),
				target = '_system';
			var ref = window.open(url, target);
		}

		function findJobVaultFiles() {
			return self.viewData.job.jobDetails.data.files;
		}

		


	}


})();