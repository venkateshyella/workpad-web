;
(function () {
	"use strict";
	angular.module('app.core')
		.factory('BootService', [
			'$q', '$timeout',
			'AppCoreUtilityServices',
			'SettingsServices',
			'Lang', 'Ping',
			'PushNotificationService', 'Subscribe',
			'URL', 'UserService', 'DataProvider', 'AuthService',
			'SAVED_PREFERENCES_KEY', 'BASE_URL',
			function BootService($q, $timeout, AppCoreUtilityServices,
			                     SettingsServices,
			                     Lang, Ping,
			                     PushNotificationService, Subscribe,
			                     URL, UserService, DataProvider, AuthService,
			                     SAVED_PREFERENCES_KEY, BASE_URL) {
				"use strict";

				var currState,
					_bootDeferred,
					bootDigest = {},
					_bootState,
					_appReadyWaitingList = [],
					LANG
					;
				var service = {
					isAppReadyResolve: isAppReadyResolve,
					isAppReady: isBootProcessComplete,
					readyApp: readyApp,
					waitForAppReady: waitForAppReady,
					resolveAppReadyListeners: resolveAppReadyListeners,
					state: _bootState,
					bootDigest: bootDigest,

					BOOT_INCOMPLETE: "1",
					BOOT_IN_PROGRESS: "2",
					BOOT_EVENT: "3"
				};

				initialize();
				return service;

				function initialize() {
					_bootState = "INCOMPLETE";
					_bootDeferred = null;

					// Clear PushNotifications
					DataProvider.resource.PushNoti.destroyAll();
				}

				function isBootProcessComplete() {
					return _bootState == "COMPLETE";
				}

				function isAppReadyResolve() {
					var deferred = $q.defer();
					if (isBootProcessComplete()) {
						deferred.resolve();
					} else {
						deferred.reject();
					}
					return deferred.promise;
				}

				function readyApp() {
					_bootDeferred = $q.defer();
					if (isBootProcessComplete()) {
						_bootDeferred.resolve();
					} else {
						loadPreferences()
							.then(runLanguageLoader)
							.then(runPingTask)
							.then(initializePushNotificationService)
							.then(runAuthentication)
							.then(function () {
								_bootDeferred.notify(new mobos.Utils.deferredNotification(service.BOOT_EVENT, {
									msg: LANG.BOOT_PROCESS.COMPLETE
								}));
								_bootDeferred.resolve();
							})
							.catch(onBootError);
					}

					return _bootDeferred.promise;

					function onBootError(error) {
						_bootDeferred.reject(error)
					}
				}

				function resolveAppReadyListeners() {
					angular.forEach(_appReadyWaitingList, function (waitee) {
						if (waitee.deferred) {
							waitee.deferred.resolve();
						}
					});
					_appReadyWaitingList = [];
					_bootState = "COMPLETE";

					_bootDeferred.notify();
					_bootDeferred.resolve();
				}

				function loadPreferences() {
					return $q.when(
						DataProvider.resource.Preference.findAll()
							.then(function () {
								initializeURLService();
								return SettingsServices.initialize();
							})
					);
				}

				function initializeURLService() {
					var _baseUrl = DataProvider.resource.Preference.get(SAVED_PREFERENCES_KEY.BASE_URL) || BASE_URL
						, _boshEndpoint = DataProvider.resource.Preference.get(SAVED_PREFERENCES_KEY.BOSH_ENDPOINT) || BASE_URL
						;
					URL.initialize(_baseUrl.value, _boshEndpoint.value);
				}

				function runLanguageLoader(prevStepResult) {
					LANG = Lang.en.data;
					_bootDeferred.notify(new mobos.Utils.deferredNotification(service.BOOT_EVENT, {
						msg: LANG.BOOT_PROCESS.LANG_LOADING_IN_PROGRESS
					}));
					service.bootDigest.languageLoader = {};
					return Lang.loadLanguage('en').then(function (result) {
						LANG = Lang.en.data;
						service.bootDigest.languageLoader.success = true;
						service.bootDigest.languageLoader.result = result;
						return result;
					})
				}

				function runPingTask(prevStepResult) {
					_bootDeferred.notify(new mobos.Utils.deferredNotification(service.BOOT_EVENT, {
						msg: LANG.BOOT_PROCESS.PING_IN_PROGRESS
					}));
					service.bootDigest.ping = {};
					return Ping.send().then(function (result) {
						service.bootDigest.ping.success = true;
						service.bootDigest.ping.result = result;
						return result;
					});
				}

				function initializePushNotificationService(prevStepResult) {
					_bootDeferred.notify(new mobos.Utils.deferredNotification(service.BOOT_EVENT, {
						msg: LANG.BOOT_PROCESS.PUSH_NOTIFICATION_REGISTRATION
					}));
					if (mobos.Platform.isWebView()) {
						PushNotificationService.initializePushNotificationListeners();
						//return
						//  .then(function() {
						//    //Subscribe.updateSubscription()
						//  });
					}
					//var saved_PushNotificationSettings
					//  = SettingsServices.get('push') && SettingsServices.get('push').value || {};
					//
					//if (saved_PushNotificationSettings) {
					//  if (saved_PushNotificationSettings.enabled) {
					//    if (saved_PushNotificationSettings.deviceToken) {
					//      PushNotificationService.updateRegistration({
					//        deviceToken: saved_PushNotificationSettings.deviceToken
					//      });
					//      console.log('Renewing device token.')
					//    } else {
					//      console.log('No device token found.')
					//    }
					//    if (mobos.Platform.isWebView()) {
					//      console.info("registering for push notifications..");
					//      return PushNotificationService.register()
					//        .then(function (res) {
					//          console.log(PushNotificationService.getRegistration());
					//          var subscriptionSettings = {
					//              isEnabled: true
					//            },
					//            registration = {
					//              key: PushNotificationService.getRegistration().regid
					//            }
					//            ;
					//          Subscribe.updateSubscription(subscriptionSettings, registration);
					//          //PushNotificationService.updateRegistration({
					//          //  deviceToken: res
					//          //});
					//        });
					//    } else {
					//      return null;
					//    }
					//  }
					//}
				}

				function runAuthentication() {
					var deferred = $q.defer();
					_bootDeferred.notify(new mobos.Utils.deferredNotification(service.BOOT_EVENT, {
						msg: LANG.BOOT_PROCESS.LOADING_USER_PROFILE
					}));
					UserService.loadProfileData()
						.then(function (savedProfileData) {
							var autoLogin = savedProfileData.autoLogin
								, email = savedProfileData.value
								, password = savedProfileData.password;

							if (autoLogin) {
								//  try authentication
								_bootDeferred.notify(new mobos.Utils.deferredNotification(service.BOOT_EVENT, {
									msg: LANG.BOOT_PROCESS.AUTHENTICATING_USER
								}));
								/*
								AuthService.webAutoLogin(authResponse)
									.then(function (res) {
										deferred.resolve(res);
										_bootDeferred.notify(new mobos.Utils.deferredNotification(service.BOOT_EVENT, {
											msg: LANG.BOOT_PROCESS.AUTHENTICATING_USER_SUCCESS
										}));
									})
									.catch(function (error) {
										deferred.reject(error);
										if (error.responseCode == 1) {
											UserService.saveProfileData({
												password: "",
												autoLogin: false
											})
										}
										_bootDeferred.notify(new mobos.Utils.deferredNotification(service.BOOT_EVENT, {
											msg: LANG.BOOT_PROCESS.AUTHENTICATING_USER_ERROR,
											failStepCode: "AUTHENTICATING_USER_ERROR"
										}));
									}) */
								
								UserService.loadAuthResponseData().then(function (authResponse) {
									
									AuthService.webAutoLogin(authResponse)
									.then(function (res) {
										deferred.resolve(res);
										_bootDeferred.notify(new mobos.Utils.deferredNotification(service.BOOT_EVENT, {
											msg: LANG.BOOT_PROCESS.AUTHENTICATING_USER_SUCCESS
										}));
									})
									.catch(function (error) {
										deferred.reject(error);
										if (error.responseCode == 1) {
											UserService.saveProfileData({
												password: "",
												autoLogin: false
											})
										}
										_bootDeferred.notify(new mobos.Utils.deferredNotification(service.BOOT_EVENT, {
											msg: LANG.BOOT_PROCESS.AUTHENTICATING_USER_ERROR,
											failStepCode: "AUTHENTICATING_USER_ERROR"
										}));
									}) 
									
								}).catch(function (error) {
									deferred.reject(error);
									
									_bootDeferred.notify(new mobos.Utils.deferredNotification(service.BOOT_EVENT, {
										msg: LANG.BOOT_PROCESS.AUTHENTICATING_USER_ERROR,
										failStepCode: "AUTHENTICATING_USER_ERROR"
									}));
								});
										
								
							} else {
								// continue
								deferred.resolve();
							}

						})
						.catch(function (error) {
							deferred.resolve();
						});

					return deferred.promise;
				}

				function waitForAppReady() {
					var deferred = $q.defer();

					if (isBootProcessComplete()) {
						deferred.resolve();
					} else {
						_appReadyWaitingList.push({
							deferred: deferred
						})

					}

					return deferred.promise;
				}

			}]);

})();
