;
(function () {
	"use strict";

	angular.module('app')
		.controller('TaskVaultViewController', ['$scope', '$stateParams','URL',
			'$timeout', 'TaskWorkflowRunner', 'Lang',
			'TaskAdminService', 'Session', 'TaskVaultAdmin', 'TaskService',
			'FileSystem', 'FileService', '$mdToast', 'CATEGORY_TYPE','AuditService','blockUI', TaskVaultViewController]);


	function TaskVaultViewController($scope, $stateParams,URL
		, $timeout, TaskWorkflowRunner, Lang
		, TaskAdminService, Session, TaskVaultAdmin, TaskService
		, FileSystem, FileService, $mdToast,CATEGORY_TYPE,AuditService,blockUI) {

		var taskId = $stateParams.taskId;
		
		$scope.taskFileDownloadUrl= URL.JOB_FILE_DOWNLOAD;

		$scope.state = {
			showAudit: false
		};
		
		$scope.TaskPageInfo = {
				pageSize: 25,
				currPage: 1
		};
		
		$scope.folderView = {
				isEnabled: false,
				folderId : 0,
				folderName: null
		};
		
		$scope.viewAllData = function(){
			$scope.folderView.isEnabled = false;
			$scope.folderView.folderId = 0;
			$scope.folderView.folderName = null;
			
			getVaultTabMenuItems();
			reLoadTaskData();
		};
		
		function reLoadTaskData(){
			$scope.taskFilesList = [];
			$scope.TaskPageInfo = {
					pageSize: 25,
					currPage: 1
			};
			getVaultFileList();
		}
		
		$scope.viewFolder = function(folderId, folderName){
			$scope.folderView.isEnabled = true;
			$scope.folderView.folderId = folderId;
			$scope.folderView.folderName = folderName;
			
			getVaultTabMenuItems();
			reLoadTaskData();
			
		};
	
		$scope.taskFilesList = [];
		
		$scope.isNextPageAvailable = false;
		$scope.loadingNext = false;
		$scope.loadNext = loadNext;
	

		$scope.taskAuditCollection = [];
		$scope.taskAuditPageLoader = TaskService
			.createTaskVaultAuditListLoader(taskId, $scope.taskAuditCollection);

		$scope.toggleAudit = function (enable) {
			if (!enable) {
				$scope.taskFilesList = [];
				$scope.TaskPageInfo = {
						pageSize: 25,
						currPage: 1
				};
				getVaultFileList();
			}
			$scope.state.showAudit = !!enable;
		};

		$scope.onTaskVaultFileItemClick_secondary = onTaskVaultFileItemClick_secondary;

		$scope.fetchTaskModelAndJobModel().then(function () {
			getVaultFileList();
			getVaultTabMenuItems();
		});

		function getVaultTabMenuItems() {

			$scope.taskTabCtrl.optionMenuItems.TAB_VAULT = [];

			$scope.xtras.selectedTabIndex = 4;
			var vaultMenuItems = [{
				name: "Create Folder",
				action: createFolderClicked,
				isAllowed: !$scope.taskTabCtrl.taskModel.isTaskClosed() && !$scope.folderView.isEnabled  && $scope.isAccessProvided
			},{
				name: "Delete Folders",
				action: deleteFolderClicked,
				isAllowed: !$scope.taskTabCtrl.taskModel.isTaskClosed() && !$scope.folderView.isEnabled && $scope.isAccessProvided
			},{
				name: "Upload File",
				action: uploadFileClicked,
				isAllowed: !$scope.taskTabCtrl.taskModel.isTaskClosed() && $scope.isAccessProvided
			}, {
				name: "Delete Files",
				action: deleteFileClicked,
				isAllowed: !$scope.taskTabCtrl.taskModel.isTaskClosed() && $scope.isAccessProvided
			}, {
				name: "Rename Files",
				action: renameFileClicked,
				isAllowed: !$scope.taskTabCtrl.taskModel.isTaskClosed() && $scope.isAccessProvided
			}, {
				name: "Copy Files",
				action: copyFileClicked,
				isAllowed: !$scope.taskTabCtrl.taskModel.isTaskClosed() && $scope.isAccessProvided
			},{
				name: "Audit",
				action: auditClicked,
				isAllowed: !$scope.folderView.isEnabled  && $scope.isAccessProvided
			}];
			angular.forEach(vaultMenuItems, function (menuItem) {
				if (menuItem.isAllowed) {
					$scope.taskTabCtrl.optionMenuItems.TAB_VAULT.push(menuItem);
				}
			});
		}

		var _rawResponse;
		function getVaultFileList() {
			
			var _params = {
					pageSize: $scope.TaskPageInfo.pageSize,
					pageNumber: $scope.TaskPageInfo.currPage
			};
			
			if($scope.folderView.isEnabled){
				_params.folderId = $scope.folderView.folderId;
			}
			
			TaskVaultAdmin.getTaskFilesList(taskId,_params)
			.then(function (res) {
				$scope.loadingNext = false;
				angular.forEach(res, function (value, key) {
					$scope.taskFilesList.push(value);
					$scope.taskFilesList = _.uniq($scope.taskFilesList, function (file, key, id) {
						return file.id;
					});
				});
				$timeout();
				checkNextPgAvailability()
			}, null, function (rawResponse) {
				_rawResponse = rawResponse;
			})
			.catch(function (error) {
			})
			.finally(function () {
			});
		}
		
		function checkNextPgAvailability() {
			var totalResults = _rawResponse.resp.paginationMetaData.totalResults;
			if ($scope.taskFilesList.length < totalResults) {
				$scope.isNextPageAvailable = true;
			} else {
				$scope.isNextPageAvailable = false;
			}
		}

		function loadNext() {
			$scope.loadingNext = true;
			$scope.TaskPageInfo.currPage += 1;
			getVaultFileList();
		}

		function onTaskVaultFileItemClick_secondary(file) {
			var url = URL.JOB_FILE_DOWNLOAD + ';' + $.param({
						jsessionid: $scope.session.id
					}) + '?' + $.param({
						userSessionId: $scope.session.id,
						id: file.id
					}),
				target = '_system';
			var ref = window.open(url, target);
		}


/*		function uploadFileClicked() {

			FileSystem.pickFile()
				.then(function (file) {
					FileService.showFilePickerConfirmDialog(file)
						.then(function (updatedFile) {
							FileService.queueForUpload(updatedFile.name, updatedFile.dataUrl, URL.TASK_FILE_UPLOAD, {
									params: {
										fileTitle: updatedFile.displayName,
										taskId: $stateParams.taskId,
										userSessionId: $scope.session.id
									},
									tagName: "taskVaultFileUpload",
									blockUI: true,
									fileObject: updatedFile
								})
								.then(function (res) {

									getVaultFileList();

									if (res.isSuccess == true) {
										var toast = $mdToast.simple()
											.content(res.respMsg)
											.position('bottom right')
											.hideDelay(4000);
										$mdToast.show(toast)
											.then(function (res) {
											});
									}

								}).catch(function (error) {
								console.log(error);
							});
						});
				})
				.catch(function (reject) {
					console.log(reject);
				});

		} */
		
		function createFolderClicked() {
			var conParams = { 
					  catId : $stateParams.taskId,
			          catType : CATEGORY_TYPE.TASK
			        };
			FileService.showCreateFolderDialog(conParams).then(function(result){
				reLoadTaskData();
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
			params.catId = $stateParams.taskId;
			params.catType = CATEGORY_TYPE.TASK;
			
			TaskVaultAdmin.findAndRemoveVaultFolders(params)
			.then(function (res) {
				if (res) {
					reLoadTaskData();
				}
				
				if(res.isSuccess == true){
					var toast = $mdToast.simple()
					.content(res.respMsg)
					.position('bottom right')
					.hideDelay(4000);
				$mdToast.show(toast)
					.then(function (res) {
					});
				}
				
			}, null, function (rawResponse) {
				if (rawResponse.isSuccess == true) {
					var toast = $mdToast.simple()
					.content(res.respMsg)
					.position('bottom right')
					.hideDelay(4000);
				$mdToast.show(toast)
					.then(function (res) {
					});
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
		
		function uploadFileClicked() {
			
			var conParams = { 
					catId : $stateParams.taskId,
					catType : CATEGORY_TYPE.TASK
			};

			if($scope.folderView.isEnabled){
				conParams.folderId = $scope.folderView.folderId;
			}
			FileService.showFileUploadConfirmDialog(conParams)
				.then(function (fileUploadInfo) {
					var updatedFile = fileUploadInfo.file[0];
					var fileParams = {
							fileTitle: updatedFile.lfFileName,
							taskId: $stateParams.taskId,
							userSessionId: $scope.session.id
					};

					if(fileUploadInfo.folderId > 0 && !fileUploadInfo.isNewFolder){
						fileParams.folderId = fileUploadInfo.folderId;
					}

					if(fileUploadInfo.isNewFolder){
						fileParams.createFolder = true;
						fileParams.folderName = fileUploadInfo.folderName;
					}
					FileService.queueForUpload(updatedFile.lfFileName, updatedFile.lfDataUrl, URL.TASK_FILE_UPLOAD, {
							params: fileParams,
							tagName: "taskVaultFileUpload",
							blockUI: true,
							fileObject: updatedFile.lfFile
						})
						.then(function (res) {
							if (res.isSuccess == true) {
								reLoadTaskData();
								//getVaultFileList();
								var toast = $mdToast.simple()
								.content(res.respMsg)
								.position('bottom right')
								.hideDelay(4000);
							$mdToast.show(toast)
								.then(function (res) {
								});
							}

						}).catch(function (error) {
					});
				});
}

		function deleteFileClicked() {
			
			var delParams = {
					taskId: $stateParams.taskId,
					folderId: -1
			};
			
			if($scope.folderView.isEnabled){
				delParams.folderId = $scope.folderView.folderId;
			}
			
			TaskVaultAdmin.findAndRemoveVaultFolderFiles(delParams)
				.then(function (res) {
					if (res) {
						angular.forEach(res, function (file, key) {
							_.remove($scope.taskFilesList, {
								id: file.id
							});
						});

					}
				}, null, function (rawResponse) {

					if (rawResponse.isSuccess == true) {

						var toast = $mdToast.simple()
							.content(rawResponse.respMsg)
							.position('bottom right')
							.hideDelay(4000);
						$mdToast.show(toast)
							.then(function (rawResponse) {
							});
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
					taskId: $stateParams.taskId,
					folderId: -1
			};
			
			if($scope.folderView.isEnabled){
				delParams.folderId = $scope.folderView.folderId;
			}

			TaskVaultAdmin.findAndRenameVaultFiles(delParams)
				.then(function (res) {
					console.log(res);
					if (res.length > 0) {
						// $scope.taskFilesList = res;
						getVaultFileList();
					}


				}, null, function (rawResponse) {

					if (rawResponse.isSuccess == true) {
						var toast = $mdToast.simple()
							.content(rawResponse.respMsg)
							.position('bottom right')
							.hideDelay(4000);
						$mdToast.show(toast)
							.then(function (rawResponse) {
							});
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
			params.catId = $stateParams.taskId;
			params.catType = CATEGORY_TYPE.TASK;
			
			if($scope.folderView.isEnabled){
				params.folderId = $scope.folderView.folderId;
			}
			TaskVaultAdmin.findAndCopyVaultFiles(params)
				.then(function (res) {
					if (res.isSuccess == true) {
						var toast = $mdToast.simple()
							.content(res.respMsg)
							.position('bottom right')
							.hideDelay(4000);
						$mdToast.show(toast)
							.then(function (res) {
							});
					}
				}, null, function (rawResponse) {
				})
				.catch(function (err) {
					console.log(err)
				})
				.finally(function () {
				});

		}

		function auditClicked() {
			var params = {};
			params.catId = $stateParams.taskId;
			params.catType = CATEGORY_TYPE.TASK;

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

	}

})();