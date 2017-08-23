;
(function () {
	"use strict";

	angular.module('app')
		.controller('OrgInfoViewController', ['$q','$scope', '$stateParams', 'blockUI', 'DataProvider','URL',
			'mDialog', '$timeout', 'Lang', 'Session', 'ImagePicker',
			'OrgAdminService', 'ImageEditorFactory', 'State','FileService','AuditService','CATEGORY_TYPE', OrgInfoViewController
		]);


	function OrgInfoViewController($q, $scope, $stateParams, blockUI
		, DataProvider, URL, Dialog
		, $timeout, Lang, Session
		, ImagePicker, OrgAdminService, ImageEditorFactory, State, FileService, AuditService, CATEGORY_TYPE) {

		var LANG = Lang.en.data;
		$scope.xtras.selectedTabIndex = 0;

		var orgId = $stateParams.orgId;
		var orgModel = DataProvider.resource.Organisation.get(orgId);
		var orgImageEditor;

		initOrgDetails();

		
		
		// $scope.orgTabCtrl.orgModel = DataProvider.resource.Organisation.get(orgId);
		/*
		 if ($scope.orgTabCtrl.orgModel) {

		 var orgModel = $scope.orgTabCtrl.orgModel
		 initOrgInfoView(orgModel);
		 } else {
		 $scope.getOrgDetails().then(function(orgModel) {
		 initOrgInfoView(orgModel);
		 });
		 }*/

		$scope.getOrgDetails().then(function (orgModel) {
			initOrgInfoView(orgModel);
		});

		function initOrgInfoView(org) {
			orgImageEditor = new ImageEditorFactory.Factory(orgImageUpdateFn, $scope.orgTabCtrl.orgModel._img_icon);
			getInfoMenuList();
			$scope.checkIfUserIsOrgVisitor(org.role);
		}

		function orgEditClicked() {
			var org = $scope.orgTabCtrl.orgModel;
			OrgAdminService.UpdateOrg(org).then(function (result) {
				$scope.orgTabCtrl.orgModel = result.data;
				console.info(result.msg);
				Dialog.showAlert(result.msg);
			}).catch(function (error) {
				Dialog.showAlert(error);
			});
		}

		function orgImageUpdateFn(newImageUri) {
			return $scope.orgTabCtrl.orgModel.uploadIconImage(newImageUri);
		}

		function getInfoMenuList() {

			$scope.orgTabCtrl.optionMenuItems.TAB_INFO = [];

			var infoMenuItems = [{
				name: "Edit",
				action: orgEditClicked,
				isAllowed: $scope.orgTabCtrl.orgModel.isActionAuthorized('EDIT')
			}, {
				name: "Edit Image",
				action: onEditImageClick,
				isAllowed: $scope.orgTabCtrl.orgModel.isActionAuthorized('EDIT')
			}, {
				name: "Delete",
				action: askAndDeleteOrg,
				isAllowed: $scope.orgTabCtrl.orgModel.isActionAuthorized('DELETE_ORG')
			}, {
				name: "Audit",
				action: auditClicked,
				isAllowed: true
			}];
			angular.forEach(infoMenuItems, function (menuItem) {
				if (menuItem.isAllowed) {
					$scope.orgTabCtrl.optionMenuItems.TAB_INFO.push(menuItem);
				}
			});
		}

		function orgEditImageClicked() {
			ImagePicker.grabNewImage({
					targetWidth: ImagePicker.IMAGE_PRESET.PROFILE.WIDTH,
					targetHeight: ImagePicker.IMAGE_PRESET.PROFILE.HEIGHT
				})
				.then(function (imageUri) {
					orgImageEditor.localImageUri = imageUri;
					orgImageEditor.showImageUploadConfirmation()
						.then(function (confirm) {
							if (confirm) {
								orgImageEditor.startUpload()
									.then(function () {
										$timeout();
										orgImageEditor.hideImageUploadConfirmation();
									})
							}
						})
				})
		}

		function askAndDeleteOrg(options) {
			var options = options || {};
			var org = $scope.orgTabCtrl.orgModel;
			var message = 'Do you wish to delete "' + org.orgName + '" ? ';
			Dialog.showConfirm({
					title: "Delete WorkSpace",
					content: message,
					$event: options.$event,
					ok: "Ok",
					cancel: "Cancel"
				})
				.then(function () {
					blockUI.start('Deleting WorkSpace "' + org.orgName + '"');
					Connect.post(URL.ORG_DELETE, {
							id: $scope.orgTabCtrl.orgModel.id
						})
						.then(function (res) {
							blockUI.stop();
							Dialog.showAlert(res.respMsg).then(function () {
								State.transitionBack();
							});

						}).catch(function (error) {
						/* blockUI.stop(error.respMsg, {
						 status: 'isError'
						 })*/

						blockUI.stop();

						Dialog.alert(error.respMsg);
					}).finally(function () {
					});

				})
				.catch(function () {
					// Do nothing!
				});
		}

		function initOrgImageEditor() {
			if (orgModel) {
				orgImageEditor = new ImageEditorFactory.Factory(orgImageUpdateFn, orgModel._img_icon);
			}
		}

		function initOrgDetails() {

			$scope.orgTabCtrl.orgId = orgId;
			initOrgImageEditor()

			blockUI.start("Loading WorkSpace details..", {
				status: 'isLoading'
			});

			if (orgId) {
				DataProvider.resource.Organisation.find(orgId, {
						bypassCache: true,
						orgId: orgId
					})
					.then(function (org) {
						$scope.orgModel = $scope.orgTabCtrl.orgModel = orgModel = org;
						initOrgImageEditor();
						getInfoMenuList();
					})
					.catch(function (error) {
						console.log(error);
					})
					.finally(function () {
						blockUI.stop();
					});
			}

		}
		
			function onEditImageClick() {

				var deferred = $q.defer()
		        , options
		        , FileEditDialogOptions;
				
			FileEditDialogOptions = {
					controller: ['$scope', '$mdDialog',
					             FileEditDialogController],
					             templateUrl: 'app/modules/file/templates/profileUpload.dialog.tpl.html',
					             clickOutsideToClose:false,
			};
			Dialog.show(FileEditDialogOptions)
			.then(function (res) {
				$scope.orgTabCtrl.orgModel.uploadIconImage(res).then(function (result) {
					
					if (result.isSuccess) {
						deferred.resolve(result);
					} else {
						deferred.reject(result);
					}
					return deferred.promise;
				});
				})
			.catch(function (err) {
				deferred.reject(err);
			});
			return deferred.promise;

			function FileEditDialogController($scope, $mdDialog) {
				$scope.isEditImageShow = false;	
				$scope.showPreview=false;
				
				$scope.image = {
						originalImage: '',
						croppedImage: ''
				};

				$scope.crop = function (file) {
					$scope.isEditImageShow = true;
					$scope.image.originalImage = file;
				}
				
				$scope.save = function () {
					
					$scope.showPreview=true;	
				}
				
				$scope.confirmWithCrop = function (dataURI) {
					
					FileService.generateFileFromBlob(dataURI).then(function (res) {
						return $mdDialog.hide(res);	
					});
				}
				
				$scope.confirm = function (file) {
					return $mdDialog.hide(file.lfFile);
				}
				
				$scope.cancel = $mdDialog.cancel;
			}
			
		}
			
			function auditClicked() {
				var params = {};
				params.catId = $stateParams.orgId;
				params.catType = CATEGORY_TYPE.ORG;

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