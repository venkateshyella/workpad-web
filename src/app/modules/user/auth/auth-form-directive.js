// auth-form-directive.js

(function () {

	angular.module('Auth')
		.directive('authForm', AuthenticationForm);

	function AuthenticationForm(AppLogger, Dialog) {

		function _preLink(scope, elem, attrs) {
			scope.userCreds = {
				email: '',
				password: ''
			};
			scope.onAuthStart = attrs.onAuthStart;
			scope.onAuthSuccess = attrs.onAuthSuccess;
			scope.onAuthError = attrs.onAuthError;
			scope.onAuthFinish = attrs.onAuthFinish;
			scope.autoLoginFlag = attrs.autoLogin;
			scope.onForgotPassword = attrs.onForgotPassword;
		}

		function _postLink(scope, elem, attrs) {
		}

		return {
			templateUrl: 'app/modules/user/auth/auth-form-partial.html',
			link: {
				pre: _preLink,
				post: _postLink
			},
			replace: true,
			scope: true,
			controller: [
				'$scope', '$timeout', 'DataProvider', 'UserService', 'AuthService', 'Securify',
				'Connect', 'Session', 'URL', 'Lang','$rootScope',
				function ($scope, $timeout, DataProvider, UserService, AuthService, Securify,
				          Connect, Session, URL, Lang, $rootScope) {

					var LANG = Lang.en.data;

					function run() {
						"use strict";

						$scope.loginInProgress = $scope.loginInProgress || false;
						

						UserService.loadProfileData()
							.then(function (savedProfileData) {
								$scope.autoLogin = savedProfileData.autoLogin;
								$scope.userCreds.email = savedProfileData.value;
								$scope.userCreds.password = savedProfileData.password;
								$scope.form.userForm && $scope.form.userForm.$setPristine();

								// Decrypt password if available
								if ($scope.userCreds.password && $scope.userCreds.password.length > 0) {
									AppLogger.log('start decryption for login view');
									$scope.userCreds.password = Securify.decrypt(savedProfileData.password, 'pef');
									AppLogger.log('end decryption for login view');
								}

							/*	if ($scope.autoLoginFlag && $scope.autoLogin) {
									$timeout(function () {
										$scope.submit($scope.userCreds, {
											delay: 500
										});
									}, 500);
								}
								*/
							}, function () {
								$scope.ready = true;
							});

						$scope.ready = true;
					}

					$scope.test = function () {
						AppLogger.log('test');
					};

					$scope.submit = function SubmitUserForm(creds, options) {
						var options = options || {};
						var loginParams = {
							userEmail: creds.email,
							userPassword: creds.password
						};

						// Invalid form check
						if (!$scope.form.userForm.$valid) {
							angular.forEach($scope.form.userForm.$error, function (errorType) {
								"use strict";
								angular.forEach(errorType, function (field) {
									field.$setDirty();
								})
							});
							return;
						}
						if ($scope.loginInProgress) {
							AppLogger.warn("login in progress...");
							return;
						}
						$scope.loginInProgress = true;
						$scope.$eval($scope.onAuthStart);

						if (options.delay) {
							$timeout(function () {
								"use strict";
								_submit()
							}, options.delay);
						} else {
							_submit();
						}

						function _submit() {
							"use strict";
							/**
							 * By default setting user 
							 * to auto login for web app
							 */
							$scope.autoLogin = true;
							
							if (!$scope.autoLogin) {
								UserService.saveProfileData({
									username: "",
									password: "",
									autoLogin: false
								})
							}
							AppLogger.log('start encryption for localstorage');
							var data = {
								username: loginParams.userEmail,
								password: Securify.encrypt(loginParams.userPassword, 'pef')
							};
							
							//using these credentails when session expires
							$rootScope.sessionCred = data;
							
							AppLogger.log('end encryption for localstorage');
							AuthService.submitLogin(data)
								.then(function (result) {
									//console.log(result);
									$timeout(function () {
										$scope.loginInProgress = false;
									}, 1000);
									if ($scope.autoLogin
										&& data.username && data.password) {
										UserService.saveProfileData({
											username: data.username,
											password: data.password,
											autoLogin: true
										})
									} else {
									}
									if ($scope.onAuthSuccess) {
										$scope.$eval($scope.onAuthSuccess);
									}
									if ($scope.onAuthFinish) {
										$scope.$eval($scope.onAuthFinish);
									}
								}, function onLoginError(error) {
									Dialog.showAlert({
										title: LANG.DIALOG.AUTH_FAIL.TITLE,
										content: error.respMsg,
										ok: "OK"
									});
									if ($scope.onAuthError) {
										$scope.$eval($scope.onAuthError);
									}
									$timeout(function () {
										$scope.loginInProgress = false;
									}, 1000);
								})
						}
					};
					

					$scope.onForgotPasswordClick = function () {
						"use strict";
						$scope.$eval($scope.onForgotPassword);
					};

					function initScope() {
						"use strict";
						$scope.form = {};
					}

					run();
				}]
		}

	}

	AuthenticationForm.$inject = ['AppLogger', 'mDialog'];

	angular.module('Auth')
		.controller('AuthFormController', AuthenticationForm);

	function AuthFormController($scope, Connect, URL) {
		$scope.submit = function SubmitUserForm(creds) {
		}
	};
	AuthFormController.$inject = ['$scope', 'Connect', 'URL'];

})();
