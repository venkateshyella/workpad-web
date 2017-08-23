/**
 * Created by sudhir on 26/5/15.
 */

;
(function () {
	"use strict";

	angular.module('app.base-controllers')
		.controller('ViewDataBaseController', ViewDataBaseController)
	;

	function ViewDataBaseController($scope, $rootScope, $q, blockUI, $mdToast, $timeout, Lang) {
		var self = this;
		var LANG = Lang.en.data;
		var loaderConfig = {};

		self.initializeViewDataBaseController = function (modelName, fetchFn, findFn, loaderConfig) {
			self[modelName] = {
				data: null,
				state: self.DATA_NA,
				activity: self.ACTIVITY_IDLE,
				refreshData: fetchFn
			};

			$scope[modelName] = {
				refresh: refreshScope,
				isActive: function () {
					return self[modelName].activity == self.ACTIVITY_FETCHING;
				},
				isError: function () {
					return self[modelName].activity == self.ACTIVITY_ERROR;
				}
			};

			loaderConfig = loaderConfig || {};

			/**
			 * $scope API for refreshing data
			 *
			 * */
			function refreshScope(options) {
				options = options || {};
				var deferred = $q.defer();
				var result = findFn && findFn() || null;
				if (!_isEmpty(result)) {
					// save existing data to model.
					self[modelName].state = self.DATA_AVAILABLE;
					self[modelName].data = result;
				}
				if (!result
					|| self[modelName].state != self.DATA_AVAILABLE) {
					self[modelName]._async = true;
				} else {
					self[modelName]._async = false;
				}
				self[modelName].activity = self.ACTIVITY_FETCHING;
				if (options.blockUI || self[modelName].state != self.DATA_AVAILABLE) {
					blockUI.start(loaderConfig.loadingMessage || LANG.DATA.DEFAULT.LOADING_MESSAGE, {
						overlayClass: "light"
					});
					self[modelName]._async = false;
				} else {
					$rootScope.toolbarLoader.async_active = true;
					self[modelName]._async = true;
				}
				self[modelName].refreshData(options)
					.then(function (result) {
						blockUI.stop();
						self[modelName].activity = self.ACTIVITY_IDLE;
						updateDataModel(result);
						deferred.resolve(result)
					}, null, function (noti) {
						deferred.notify(noti);
					})
					.catch(function (error) {
						var errorMsg = error.respMsg || "Error Loading data..";
						self[modelName].activity = self.ACTIVITY_ERROR;
						if (self[modelName]._async) {
							$mdToast.show(
								$mdToast.simple()
									.content(errorMsg)
								//.action('Retry')
								)
								.then(function (res) {
									if (res == 'retry') {
										$timeout(function () {
											refreshScope(options)
										}, 100);
									}
								});
						} else {
							blockUI.stop(errorMsg, {
								status: "isError",
								action: "Ok"
							});
						}
						updateDataModel(self[modelName].data);
						deferred.reject(error)
					})
					.finally(function () {
						$rootScope.toolbarLoader.async_active = false;
					});
				//} else {
				//  updateDataModel(result);
				//  deferred.resolve(result);
				//}
				return deferred.promise;
			}

			function updateDataModel(data) {
				self[modelName].data = data;
				if (data != null && angular.isDefined(self[modelName].data)) {
					self[modelName].state = self.DATA_AVAILABLE;
				} else {
					self[modelName].state = self.DATA_NA;
				}
			}

			function _isEmpty(data) {
				if (angular.isArray(data)) {
					return data.length == 0;
				} else if (angular.isObject(data)) {
					for (var key in data) {
						return false;
					}
					return true;
				} else {
					return !data;
				}
			}

			return self;
		};

		self.ACTIVITY_FETCHING = "_fetching";
		self.ACTIVITY_IDLE = "_idle";
		self.ACTIVITY_ERROR = "_error";
		self.DATA_AVAILABLE = "_data_avail";
		self.DATA_NA = "_data_na";
	}

	ViewDataBaseController.$inject = ['$scope', '$rootScope', '$q', 'blockUI', '$mdToast', '$timeout', 'Lang'];

})();