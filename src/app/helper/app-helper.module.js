/**
 * Created by sudhir on 1/4/16.
 */

;(function () {

	function ServiceRunner($q, $mdToast, blockUI, Lang) {
		"use strict";

		var LANG = Lang.data;
		var serviceRunnerOptions = {
			blockUI: false,
			loadingMessage: LANG.MESSAGES.LOADING,
			showSuccess: true,
			alertSuccess: true,
			notifySuccess: false,
			defaultSuccess: LANG.SUCCESS.SERVICE_SUCCESS,
			defaultError: LANG.ERROR.SERVICE_ERROR,
			showError: true,
			notificationTimeout: 3000
		};

		var SERVICE_ACTIVITY = {
			RUNNING: 0,
			SUCCESS: 1,
			ERROR: 2
		};

		return {
			buildServiceRunnerFn: buildServiceRunnerFn
		};

		function buildServiceRunnerFn(serviceFn, options) {
			var _options = angular.extend({}, serviceRunnerOptions, options || {});
			var _status = null;
			var serviceRunnerFn = function () {
				var deferred = $q.defer();
				try {
					applyServiceStartActions();
					$q.when(serviceFn.apply(this, arguments))
						.then(function (res) {
							applyServiceEndActions(false, {
								respMsg: (res && res.respMsg)
							});
							deferred.resolve(res);
						}, null, function (noti) {
							deferred.notify(noti);
						})
						.catch(function (err) {
							applyServiceEndActions(true, {
								respMsg: (err && err.respMsg)
							});
							deferred.reject(err);
						})
					;
				}
				catch (e) {
					applyServiceEndActions(true, {
						respMsg: "Internal App error"
					});
					deferred.reject(e);
				}
				return deferred.promise;
			};
			serviceRunnerFn.isActive = function () {
				return _status == SERVICE_ACTIVITY.RUNNING;
			};

			serviceRunnerFn.isError = function () {
				return _status == SERVICE_ACTIVITY.ERROR;
			};

			return serviceRunnerFn;

			function applyServiceStartActions() {
				_status = SERVICE_ACTIVITY.RUNNING;
				if (_options.blockUI) {
					var loadingMsg = _options.loadingMessage;
					blockUI.start(loadingMsg);
				}
				else {
				}
			}

			function applyServiceEndActions(isError, result) {
				_status = isError ? SERVICE_ACTIVITY.ERROR : SERVICE_ACTIVITY.SUCCESS;
				if (_options.blockUI) {
					if (isError) {
						var errMsg = (result && result.respMsg) || "Error";
						blockUI.stop(errMsg, {
							status: 'isError',
							action: 'Ok'
						});
					}
					else {
						var successMsg = (result && result.respMsg) || _options.defaultSuccess;
						if (options.showSuccess || options.alertSuccess) {
							blockUI.stop(successMsg, {
								status: 'isSuccess',
								action: 'Ok'
							});
						} else {
							blockUI.stop();
							if (options.notifySuccess) {
								$mdToast.show(
									$mdToast.simple()
										.content(successMsg)
										//.action('View Notifications')
										.position('bottom right')
										.hideDelay(_options.notificationTimeout))
								;
							}
						}
					}
				}
				else {
					var toastMsg = result && result.respMsg || _options.defaultError;
					if (isError && _options.showError) {
						$mdToast.show(
							$mdToast.simple()
								.content(toastMsg)
								//.action('View Notifications')
								.position('bottom right')
								.hideDelay(_options.notificationTimeout))
							.then(function () {
							});
					} else if (_options.showSuccess) {
						$mdToast.show(
							$mdToast.simple()
								.content(toastMsg)
								//.action('View Notifications')
								.position('bottom right')
								.hideDelay(_options.notificationTimeout))
							.then(function () {
							});
					}
				}
			}
		}
	}

	ServiceRunner.$inject = ['$q', '$mdToast', 'blockUI', 'Lang'];

	angular.module('app.helpers', ['mobos.utils', 'ngMaterial', 'blockUI'])
		.factory('ServiceRunner', ServiceRunner)
	;

})();