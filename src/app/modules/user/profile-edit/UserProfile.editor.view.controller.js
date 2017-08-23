/**
 * Created by sudhir on 4/1/16.
 */

angular.module('app')
	.controller('UserProfileEditorViewController', [
		'$scope', '$q', '$timeout', '$stateParams', '$controller',
		'Session', '$http', 'blockUI',
		'$cordovaCamera', 'Connect',
		'DataProvider', 'State', 'mDialog', 'ImagePicker', 'ImageEditorFactory','FileService',
		'URL', 'Lang',
		function ($scope, $q, $timeout, $stateParams, $controller,
		          Session, $http, blockUI,
		          $cordovaCamera, Connect, DataProvider,
		          State, Dialog, ImagePicker, ImageEditorFactory,FileService) {
			"use strict";

			var userId = $stateParams.id
				, user = null
				, userProfileIconEditor
				;

			$scope.viewScope.editorViewTitle = $scope.LANG.USER_EDIT.TITLE.EDIT_PROFILE;

			angular.extend($scope, {
				editProfileImage: editProfileImage
			});

			refresh();

			function refresh() {
				$scope.refreshUserModel()
					.then(function (user) {
					});
				userProfileIconEditor = new ImageEditorFactory.Factory(uploadProfileImage)
			}

//			function editProfileImage() {
//				"use strict";
//				alert("entered editProfileImage from user profile");
//				ImagePicker.grabNewImage({
//					targetWidth: 1024,
//					targetHeight: 1024
//				}).then(function (imageUri) {
//					userProfileIconEditor.localImageUri = imageUri;
//					userProfileIconEditor.showImageUploadConfirmation()
//						.then(function (confirm) {
//							if (confirm) {
//								userProfileIconEditor.startUpload()
//									.then(function () {
//										$scope.user.refreshImageHash();
//										$timeout();
//										userProfileIconEditor.hideImageUploadConfirmation();
//									})
//							}
//						});
//				});
//			}
	
			function editProfileImage() {
				"use strict";

				var deferred = $q.defer()
		        , options
		        , FileEditDialogOptions;
				
			FileEditDialogOptions = {
					controller: ['$scope', '$mdDialog',
					             FileEditDialogController],
					             templateUrl: 'app/modules/file/templates/profileUpload.dialog.tpl.html',
					             clickOutsideToClose: false,
			};
			Dialog.show(FileEditDialogOptions)
			.then(function (res) {
				uploadProfileImage(res).then(function (result) {
					
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
			

			function uploadProfileImage(imageUri) {
				var deferred = $q.defer();
				$timeout(function () {
					$scope.user.uploadProfileImage(imageUri)
						.then(function (res) {
							console.log(res);
							deferred.resolve(res);
							blockUI.stop();
						}, null, function (noti) {
							deferred.notify(noti);
						})
						.catch(function (error) {
							deferred.reject(error);
						});
				}, 100);
				return deferred.promise;
			}

		}
	])
;