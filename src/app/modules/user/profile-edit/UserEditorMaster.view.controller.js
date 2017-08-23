/**
 * Created by sudhir on 5/1/16.
 */

angular.module('app')
	.controller('UserEditorMasterController', [
		'$scope', '$q', '$timeout', '$stateParams', '$controller',
		'Session', '$http', 'blockUI',
		'$cordovaCamera', 'Connect',
		'DataProvider', 'State', 'mDialog', 'ImagePicker',
		'URL', 'Lang',
		function ($scope, $q, $timeout, $stateParams, $controller,
		          Session, $http, blockUI,
		          $cordovaCamera, Connect, DataProvider,
		          State, Dialog, ImagePicker,
		          URL) {
			"use strict";

			var userId = $stateParams.id
				, user = null
				;

			angular.extend(self, $controller('ViewDataBaseController', {
				$scope: $scope
			}));

			self.initializeViewDataBaseController('userProfile', findUserProfileInfo, getUserProfileInfo);

			angular.extend($scope, {
				form: {
					isDisabled: false
				},
				viewScope: {
					toggleEditToolbar: false,
					optionsMenuItems: {
						refresh: {
							text: $scope.LANG.BUTTON.REFRESH,
							isDisabled: false,
							isHidden: false,
							action: function () {
								refresh({bypassCache: true, blockUI: true})
							}
						}
					}
				},
				refreshUserModel: refresh,
				onUserModelFormChange: onUserModelFormChange,
				discardChanges: discardChanges,
				submitUserProfileData: function () {
					$scope.form.isDisabled = true;
					$timeout(function () {
						submitUserProfileData();
					}, 500);
				}

			});

			refresh();

			function submitUserProfileData() {
				"use strict";

				var oldUserData = angular.copy(DataProvider.resource.User.get($scope.user.id));

				DataProvider.resource.User.inject($scope.user);

				if (!$scope.form.userForm.$valid) {
					Dialog.alert({
						title: 'Update profile',
						content: "There are some errors in the profile form.",
						ok: $scope.LANG.BUTTON.OK
					});
					$scope.appProgressBlocker.stop();
					$scope.form.isDisabled = false;
					return;
				}
				//$scope.appProgressBlocker.start("Updating user profile");
				$scope.form.isDisabled = true;
				//var updateProgressDialog = Dialog.progress({content: "Updating.."});
				//Dialog.show(updateProgressDialog);
				//$timeout(function() {
				//  updateProgressDialog._options.content = "Updating Images..";
				//}, 1000);

				$scope.appProgressBlocker.start("Updating");

				updateUserProfile()
					.then(function onUpdateSuccess() {
						$scope.form.isDisabled = false;
						$scope.viewScope.toggleEditToolbar = false;
						$scope.appProgressBlocker.stop("Profile update successfully", {
							status: "isSuccess"
						});
						refresh({bypassCache: true});

						//user_firstName
						document.activeElement.blur();
					})
					.catch(function onUpdateError(error) {
						$scope.form.isDisabled = false;
						$scope.viewScope.toggleEditToolbar = true;
						$scope.appProgressBlocker.stop(error.respMsg);
					})
				;

				function updateUserProfile() {
					var deferred = $q.defer();
					if ($scope.form.userForm.$dirty) {

						if (!$scope.form.userForm.$valid) {
							deferred.reject();
							return deferred.promise;
						} else {
							submit();
						}

					} else {
						deferred.resolve();
					}

					return deferred.promise;

					function submit() {
						"use strict";
						DataProvider.resource.User.update($scope.user.id,
							$scope.user).then(function (result) {
							$scope.form.userForm.$setPristine();
							deferred.resolve(result);
						}, function onUpdateFail(error) {
							deferred.reject(error);
						});
					}
				}
			}

			function findUserProfileInfo(options) {
				return DataProvider.resource.User.find(userId, options || {});
			}

			function getUserProfileInfo() {
				DataProvider.resource.User.get(userId);
			}

			function refresh(options) {
				if (userId) {
					return $scope.userProfile.refresh(options)
						.then(function (userModel) {
							$scope.user = angular.copy(userModel);
							return $scope.user;
						})
						.catch(function (err) {
							return err;
						})
						;
				} else {
					return null;
				}
			}

			function onUserModelFormChange(form) {
				if (form.$dirty) {
					$scope.viewScope.toggleEditToolbar = true;
				} else {
					$scope.viewScope.toggleEditToolbar = false;
				}
			}

			function discardChanges() {
				"use strict";
				$scope.form.userForm.$setPristine();
				refresh();
				$scope.viewScope.toggleEditToolbar = false;
			}

		}
	]);