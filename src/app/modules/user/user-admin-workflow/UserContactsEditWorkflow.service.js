/**
 * Created by sudhir on 5/1/16.
 */

angular.module('app')
	.service('UserContactsEditWorkflow', [
		'mDialog', '$q', 'DataProvider', 'Lang',
		function (Dialog, $q, DataProvider, Lang) {
			"use strict";

			var LANG = Lang.en.data;
			return {
				runAddEmailWorkflow: runAddEmailWorkflow,
				AddPhoneNumberWorkflowRunner: AddPhoneNumberWorkflowRunner,
				RemovePhoneNumberWorkflowRunner: RemovePhoneNumberWorkflowRunner,
				RemoveEmailNumberWorkflowRunner: RemoveEmailNumberWorkflowRunner
			};

			function runAddEmailWorkflow() {

				var _options = {};

				return {
					configure: function (options) {
						angular.extend(_options, options)
					},
					startWorkflow: function () {
						_startWorkflow.apply(this, arguments);
					}
				};

				function _startWorkflow(userId) {
					//var userId = _options.userId;
					if (!userId) {
						console.error("user id not found");
					}
					var user = DataProvider.resource.User.get(userId);
					Dialog.show({
						templateUrl: 'app/modules/user/user-admin-workflow/template/add-user-email-dialog.tpl.html',
						 clickOutsideToClose:false,
						controller: [
							'$scope', '$timeout', '$mdDialog', 'blockUI', 'DataProvider', 'Lang',
							function ($scope, $timeout, $mdDialog, blockUI,
							          DataProvider, Lang) {
								var LANG = Lang.en.data;

								angular.extend($scope, {
									cancel: function () {
										$mdDialog.cancel()
									},
									hide: function () {
										$mdDialog.hide()
									},
									user: user,
									emailObj: {
										emailId: ""
									},
									form: {},
									updateUserEmail: function (email) {
										$timeout(function () {
											if ($scope.form.newEmailForm.$invalid) {
												return;
											}
											blockUI.start(LANG.USER_EDIT.LOADING_MSGS.UPDATING_PROFILE);
											_updateUserEmail(user, email)
												.then(function (updatedUserModel) {
													blockUI.stop(LANG.USER_EDIT.LOADING_MSGS.UPDATING_PROFILE_SUCCESS, {
														status: 'isSuccess'
													});
													$mdDialog.hide(updatedUserModel)
												})
												.catch(function (err) {
													blockUI.stop(err.respMsg, {
														status: 'isError'
													});
													console.log(err);
												})
										}, 500);
									},
									LANG: LANG
								});

								$timeout(function () {
									$scope.focusTriggerElem = true;
								}, 500);

								function _updateUserEmail(userModel, emailString) {
									var userClone = angular.copy(userModel);
									userClone.addNewEmail(emailString);
									return DataProvider.resource.User.update(userClone.id, userClone)
								}
							}
						]
					})
				}
			}

			function RemoveEmailNumberWorkflowRunner() {
				var _options = {};

				return {
					configure: function (options) {
						angular.extend(_options, options)
					},
					startWorkflow: function () {
						_startWorkflow.apply(this, arguments);
					}
				};

				function _startWorkflow(userId) {
					var deferred = $q.defer();

					if (!userId) {
						console.error("user id not found");
						deferred.reject();
						return deferred.promise;
					}
					var user = DataProvider.resource.User.get(userId);

					if (user.$_otherEmailList && user.$_otherEmailList.length > 0) {
					} else {
						return Dialog.alert({
							title: LANG.USER_EDIT.CONTACTS.REMOVE_EMAIL,
							content: LANG.USER_EDIT.MESSAGE.NO_EMAILS_AVAILABLE,
							ok: LANG.BUTTON.OK
						});
					}

					Dialog.show({
						templateUrl: 'app/modules/user/user-admin-workflow/template/remove-user-email.dialog.tpl.html',
						 clickOutsideToClose:false,
						controller: [
							'$scope', '$timeout', '$mdDialog', 'blockUI', 'DataProvider', 'Lang',
							function ($scope, $timeout, $mdDialog, blockUI,
							          DataProvider, Lang) {
								var LANG = Lang.en.data;

								angular.extend($scope, {
									cancel: function () {
										$mdDialog.cancel()
									},
									hide: function () {
										$mdDialog.hide();
									},
									user: user,
									emails: angular.copy(user.emails),
									form: {},
									selectedItemsCount: 0,
									selectTelNumberForDeletion: function (email) {
										email.isSelected = !email.isSelected;
										updateSelection();
									},
									updateUserEmails: function () {
										$timeout(function () {
											blockUI.start(LANG.USER_EDIT.LOADING_MSGS.UPDATING_PROFILE);
											var newEmailList = angular.copy(
												_.filter($scope.emails, function (email) {
													return !email.isSelected
												}));
											_.each(newEmailList, function (email) {
												delete(email.isSelected);
											});
											_updateUserEmails(user, newEmailList)
												.then(function (updatedUserModel) {
													blockUI.stop(LANG.USER_EDIT.LOADING_MSGS.UPDATING_PROFILE_SUCCESS, {
														status: 'isSuccess'
													});
													$mdDialog.hide(updatedUserModel)
												})
												.catch(function (err) {
													blockUI.stop(err.respMsg, {
														status: 'isError'
													});
													console.log(err);
												})
										}, 500);
									},
									updateSelection: updateSelection,
									toggleSelectAll: toggleSelectAll,
									LANG: LANG
								});

								function updateSelection() {
									var selectedEmails = _.where($scope.emails, {isSelected: true});
									$scope.isAllSelected = selectedEmails.length == $scope.emails.length;
									if (selectedEmails.length > 1) {

									}
									$scope.selectedItemsCount = selectedEmails.length;
								}

								function toggleSelectAll(status) {
									var targetSelectStatus = false;
									if (!angular.isDefined(status)) {
										targetSelectStatus = !$scope.isAllSelected;
									} else {
										targetSelectStatus = !!status;
									}
									_.each($scope.emails, function (email) {
										email.isSelected = targetSelectStatus;
									});
									updateSelection();
								}
							}
						]
					});

					return deferred.promise;

					function _updateUserEmails(userModel, newEmailList) {
						var userClone = angular.copy(userModel);
						userClone.emails = newEmailList;
						return DataProvider.resource.User.update(userClone.id, userClone)
					}
				}
			}

			function AddPhoneNumberWorkflowRunner() {
				var _options = {};

				return {
					configure: function (options) {
						angular.extend(_options, options)
					},
					startWorkflow: function () {
						_startWorkflow.apply(this, arguments);
					}
				};

				function _startWorkflow(userId) {
					var deferred = $q.defer();

					if (!userId) {
						console.error("user id not found");
					}
					var user = DataProvider.resource.User.get(userId);

					Dialog.show({
						templateUrl: 'app/modules/user/user-admin-workflow/template/add-user-phone-dialog.tpl.html',
						controller: [
							'$scope', '$timeout', '$mdDialog', 'blockUI', 'DataProvider', 'Lang',
							function ($scope, $timeout, $mdDialog, blockUI,
							          DataProvider, Lang) {
								var LANG = Lang.en.data;

								angular.extend($scope, {
									cancel: function () {
										$mdDialog.cancel()
									},
									hide: function () {
										$mdDialog.hide()
									},
									user: user,
									newPhoneNum: "",
									form: {},
									updateUserPhoneNumbers: function (phoneNum) {
										$timeout(function () {
											if ($scope.form.newPhoneNumber.$invalid) {
												return;
											}
											blockUI.start(LANG.USER_EDIT.LOADING_MSGS.UPDATING_PROFILE);
											_updateUserPhoneNumbers(user, phoneNum)
												.then(function (updatedUserModel) {
													blockUI.stop(LANG.USER_EDIT.LOADING_MSGS.UPDATING_PROFILE_SUCCESS, {
														status: 'isSuccess'
													});
													$mdDialog.hide(updatedUserModel)
												})
												.catch(function (err) {
													blockUI.stop(err.respMsg, {
														status: 'isError'
													});
													console.log(err);
												})
										}, 500);
									},
									LANG: LANG
								});

								$timeout(function () {
									$scope.focusTriggerElem = true;
								}, 500);

								function _updateUserPhoneNumbers(userModel, phoneNumber) {
									var userClone = angular.copy(userModel);
									userClone.addNewPhoneNumber(phoneNumber);
									return DataProvider.resource.User.update(userClone.id, userClone)
								}
							}
						],
						clickOutsideToClose:false
					});

					return deferred.promise;
				}
			}

			function RemovePhoneNumberWorkflowRunner() {
				var _options = {};

				return {
					configure: function (options) {
						angular.extend(_options, options)
					},
					startWorkflow: function () {
						_startWorkflow.apply(this, arguments);
					}
				};

				function _startWorkflow(userId) {
					var deferred = $q.defer();

					if (!userId) {
						console.error("user id not found");
						deferred.reject();
						return deferred.promise;
					}
					var user = DataProvider.resource.User.get(userId);
					if (user.$_telephoneNumberList && user.$_telephoneNumberList.length > 0) {
					} else {
						return Dialog.alert({
							title: LANG.USER_EDIT.CONTACTS.REMOVE_TEL,
							content: LANG.USER_EDIT.MESSAGE.NO_TEL_AVAILABLE,
							ok: LANG.BUTTON.OK
						});
					}

					Dialog.show({
						templateUrl: 'app/modules/user/user-admin-workflow/template/remove-user-phone.dialog.tpl.html',
						 clickOutsideToClose:false,
						controller: [
							'$scope', '$timeout', '$mdDialog', 'blockUI', 'DataProvider', 'Lang',
							function ($scope, $timeout, $mdDialog, blockUI,
							          DataProvider, Lang) {
								var LANG = Lang.en.data;

								angular.extend($scope, {
									cancel: function () {
										$mdDialog.cancel()
									},
									hide: function () {
										$mdDialog.hide();
									},
									user: user,
									telNumbers: angular.copy(user.telNumbers),
									form: {},
									telNumberMeta: {},
									selectedItemsCount: 0,
									selectTelNumberForDeletion: function (telNumber) {
										telNumber.isSelected = !telNumber.isSelected;
										updateSelection();
									},
									updateUserPhoneNumbers: function () {
										$timeout(function () {
											blockUI.start(LANG.USER_EDIT.LOADING_MSGS.UPDATING_PROFILE);
											var newTelNumberList = angular.copy(
												_.filter($scope.telNumbers, function (telNumber) {
													return !telNumber.isSelected
												}));
											_.each(newTelNumberList, function (telNumber) {
												delete(telNumber.isSelected);
											});
											_updateUserTelNumbers(user, newTelNumberList)
												.then(function (updatedUserModel) {
													blockUI.stop(LANG.USER_EDIT.LOADING_MSGS.UPDATING_PROFILE_SUCCESS, {
														status: 'isSuccess'
													});
													$mdDialog.hide(updatedUserModel)
												})
												.catch(function (err) {
													blockUI.stop(err.respMsg, {
														status: 'isError'
													});
													console.log(err);
												})
										}, 500);
									},
									updateSelection: updateSelection,
									toggleSelectAll: toggleSelectAll,
									LANG: LANG
								});

								$timeout(function () {
									$scope.focusTriggerElem = true;
								}, 500);

								function updateSelection() {
									var selectedTelNumbers = _.where($scope.telNumbers, {isSelected: true});
									$scope.isAllSelected = selectedTelNumbers.length == $scope.telNumbers.length;
									if (selectedTelNumbers.length > 1) {

									}
									$scope.selectedItemsCount = selectedTelNumbers.length;
								}

								function toggleSelectAll(status) {
									var targetSelectStatus = false;
									if (!angular.isDefined(status)) {
										targetSelectStatus = !$scope.isAllSelected;
									} else {
										targetSelectStatus = !!status;
									}
									_.each($scope.telNumbers, function (number) {
										number.isSelected = targetSelectStatus;
									});
									updateSelection();
								}
							}
						]
					});

					return deferred.promise;

					function _updateUserTelNumbers(userModel, newTelNumberList) {
						var userClone = angular.copy(userModel);
						userClone.telNumbers = newTelNumberList;
						return DataProvider.resource.User.update(userClone.id, userClone)
					}
				}
			}

		}
	])
;