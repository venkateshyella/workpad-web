/**
 * Created by sudhir on 10/12/15.
 */

;
(function () {
	"use strict";

	angular.module('AppBadge', ['ngCordova'])
		.provider('AppBadgeService', [
			function () {

				var defaultConfig = {
					persistBadge: true
				};

				return {
					$get: [
						'$q', '$cordovaPush',
						function ($q, $cordovaPush) {
							var _config = angular.extend({}, defaultConfig);
							var currentBadgeNumber = null;

							document.addEventListener("pause", onAppPause, false);

							return {

								configure: function (config) {
									angular.extend(_config, config);
								},

								/**
								 * @param {Number} badgeNumber Number t be shown on the app icon.
								 */
								setBadgeNumber: function (badgeNumber) {
									switch (typeof badgeNumber) {
										case 'number':
											currentBadgeNumber = badgeNumber;
											break;
										case 'string':
											var parsedInt = parseInt(badgeNumber);

											if (parsedInt >= 0) {
												currentBadgeNumber = parsedInt;
											}
									}
									return notify();
								}

								/**
								 * Remove badge number.
								 *
								 * [NOT SUPPORTED]
								 */
								//clearBadge: function () {
								//	notify();
								//}
							};

							function notify() {
								var deferred = $q.defer();
								if (mobos.Platform.isWebView()) {
									$cordovaPush.setBadgeNumber(currentBadgeNumber)
										.then(function (res) {
											deferred.resolve(res);
										})
										.catch(function (err) {
											deferred.reject(err);
										});
								} else {
									console.info('AppBadgeService: Setting badge number:', currentBadgeNumber);
									deferred.resolve();
								}

								return deferred.promise;
							}

							function onAppPause() {
								if (_config.persistBadge) {
									notify();
								}
							}

						}
					]
				}
			}
		])

})();