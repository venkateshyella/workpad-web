/**
 * Created by sudhir on 15/6/15.
 */

/**
 * Created by rihdus on 21/5/15.
 */

;
(function () {
	"use strict";

	angular.module('mobos.utils.pushNotification', ['ngCordova'])

		.provider('PushNotificationService', ['PUSH_PLATFORM',
			PushNotificationService])

		.constant('PUSH_PLATFORM', {
			IOS: 'ios',
			ANDROID: 'android'
		})
	;

	function PushNotificationService(PUSH_PLATFORM) {


		var pushConfigurationPresets = {}
			, devicePushConfiguration = null
			;

		return {
			configureNewDevicePreset: configureNewDevicePreset,
			resetDevicePushConfiguration: resetDevicePushConfiguration,
			$get: ['$rootScope', '$q',
				'$cordovaPush', 'AppBadgeService',
				'mDialog', 'DataProvider', 'AppLogger',
				'APP_BROADCAST', 'PUSH_NOTIFICATION_TYPE',
				PushNotificationServiceApi]
		};

		/**
		 * @name configureNewDevicePreset
		 * @desc Add new push configuration for a platform.
		 *
		 * @param name {String} Configuration name.
		 * @param platform {String} ENUM [PUSH_PLATFORM.IOS, PUSH_PLATFORM.ANDROID] Platform type.
		 * @param presetOptions {Object} Push configuration for the platform.
		 */
		function configureNewDevicePreset(name, platform, presetOptions) {
			switch (platform) {

				case PUSH_PLATFORM.IOS:
				case PUSH_PLATFORM.ANDROID:
					pushConfigurationPresets[name] = {
						name: name,
						platform: platform,
						config: angular.copy(presetOptions)
					};
					if (!devicePushConfiguration) devicePushConfiguration = pushConfigurationPresets[name];
					break;

				default:
					throw "Invalid Platform: " + platform;
					break;
			}
		}

		function resetDevicePushConfiguration(name) {
			if (angular.isDefined(pushConfigurationPresets[name])) {
				devicePushConfiguration = pushConfigurationPresets[name];
			} else {
				throw "Device configuration: " + name + " not found";
			}
		}


		function PushNotificationServiceApi($rootScope, $q
			, $cordovaPush, AppBadgeService
			, Dialog, DataProvider, AppLogger
			, APP_BROADCAST, PUSH_NOTIFICATION_TYPE) {

			var notificationBucket = []
				, _notification_waitingList = {}
				, pushRegistrationFile = {
					newRegistration: {}
				}
				, notificationListenerConfig = {}
				;

			return {
				PUSH_NOTIFICATION_TYPE: PUSH_NOTIFICATION_TYPE,
				allNotifications: allNotifications,
				register: register,
				unRegister: unRegister,
				getRegistration: getRegistration,
				updateRegistration: updateRegistration,
				initializePushNotificationListeners: initializePushNotificationListeners,
				waitForNewNotification: waitForNewNotification,
				unWaitForNewNotification: unWaitForNewNotification,
			};

			function allNotifications() {
				return notificationBucket;
			}

			function updateRegistration(data) {
				angular.extend(pushRegistrationFile.newRegistration, data);
			}

			function register() {
				var deferred = $q.defer();
				if (!mobos.Platform.isWebView()) {
					Dialog.alert("PushNotificationService.register can only be invoked on a cordova device. Please deploy the app in a device and try again!")
						.then(function () {
							deferred.reject("Invalid platform");
						});
					return deferred.promise;
				}

				var pushConfiguration = _pickDeviceConfiguration(),
					registrationRecord = {}
					;

				initializePushNotificationListeners();

				$cordovaPush.register(pushConfiguration)
					.then(function (result) {
						registrationRecord.config = pushConfiguration;
						registrationRecord.response = result;
						registrationRecord.deferred = deferred;
						pushRegistrationFile.record = registrationRecord;
						mobos.Platform.isIOS() && onIOSRegistrationSuccess(result);
					})
					.catch(function (error) {
						registrationRecord.response = error;
						registrationRecord.isSuccess = false;
						registrationRecord.deferred = deferred;
						pushRegistrationFile.record = registrationRecord;
						deferred.reject(error);
					})
					.finally(function () {
					})
				;

				return deferred.promise;
			}

			function onIOSRegistrationSuccess(registrationResult) {
				var regId = registrationResult;
				pushRegistrationFile.newRegistration = {
					regId: regId
				};
				pushRegistrationFile.record
				&& pushRegistrationFile.record.deferred
				&& pushRegistrationFile.record.deferred
					.resolve(pushRegistrationFile.newRegistration);
			}

			function unRegister() {
				if (!ionic.Platform.isWebView()) {
					return Dialog.alert("PushNotificationService.unRegister can only be invoked on a cordova device. Please deploy the app in a device and try again!");
				}

				var unregisterConfig = {};

				return $cordovaPush.unregister(unregisterConfig);

			}

			function getRegistration() {
				switch (mobos.Platform.device().platform) {
					case "iOS":
						return {
							key: pushRegistrationFile.newRegistration.regId
						};
						break;

					case "Android":
						return {
							key: pushRegistrationFile.newRegistration.regid,
							subscriptionId: pushRegistrationFile.newRegistration.subscriptionId
						};
						break;

					default:
						return {
							key: "mock registration id, used only in development env. do"
						}
				}
				return pushRegistrationFile.newRegistration;
			}

			function initializePushNotificationListeners() {
				mobos.Platform.isAndroid() && pushNotificationListener_Android();
				mobos.Platform.isIOS() && pushNotificationListener_iOS();
			}

			function pushNotificationListener_Android() {
				if ($rootScope.pushNotificationListener) return;
				$rootScope.pushNotificationListener =
					$rootScope.$on('$cordovaPush:notificationReceived', function (event, notification) {
						switch (notification.event) {
							case 'registered':
								if (notification.regid.length > 0) {
									if (pushRegistrationFile.record) {
										pushRegistrationFile.record.isSuccess = true;

										pushRegistrationFile.record.deferred &&
										pushRegistrationFile.record.deferred.resolve(notification);

										pushRegistrationFile.newRegistration = notification;
										pushRegistrationFile.newRegistration.deviceToken =
											pushRegistrationFile.record.config;

									}
								}
								break;

							case 'message':
								// this is the actual push notification. its format depends on the data model from the push server
								var notificationObj = _preparePayloadFromGCMNotificationMessage(notification);
								//AppLogger.log(JSON.stringify(notificationObj));
								DataProvider.resource.PushNoti.create(notificationObj)
									.then(function () {
										_notifyNotificationsListeners(notificationObj);
										$rootScope.$broadcast(APP_BROADCAST.NEW_PUSH_NOTIFICATION, notificationObj);

									});
								break;

							case 'error':
								Dialog.alert('GCM error = ' + notification.msg);
								break;

							default:
								Dialog.alert('An unknown GCM event has occurred');
								break;
						}
					});

				function _preparePayloadFromGCMNotificationMessage(notification) {
					var notiObj = {
						message: notification.message,
						payload: {}
					};
					if (notification.payload && notification.payload.payload) {
						angular.extend(notiObj.payload, notification.payload.payload);
						notiObj.title = notification.payload.title;
					} else {
						console.error("notification payload not found..");
						console.log(notification);
					}
					return notiObj;
				}
			}

			function pushNotificationListener_iOS() {
				if ($rootScope.pushNotificationListener) return;
				$rootScope.pushNotificationListener
					= $rootScope.$on('$cordovaPush:notificationReceived',
					function (event, notification) {
						var notiObj = _preparePayloadFromAPNSNotification(notification);
						if (notiObj) {
							//notification.payload = notiObj;
							//notificationBucket.push(notification);
							try {
								DataProvider.resource.PushNoti.create(notiObj)
									.then(function () {
										_notifyNotificationsListeners(notiObj);
										$rootScope.$broadcast(APP_BROADCAST.NEW_PUSH_NOTIFICATION, notiObj);
									});
							} catch (e) {
								AppLogger.log(JSON.stringify(e));
							}
							//AppLogger.log(JSON.stringify(notiObj));
							//DataProvider.resource.PushNoti.create(notiObj)
							//	.then(function () {
							//		_notifyNotificationsListeners(notiObj);
							//		$rootScope.$broadcast(APP_BROADCAST.NEW_PUSH_NOTIFICATION, notiObj);
							//	});
							//_notifyNotificationsListeners(notification);
							//$rootScope.$broadcast(APP_BROADCAST.NEW_PUSH_NOTIFICATION, notification);
						} else {
							console.error(notiObj);
						}

						if (notification.alert) {
							//navigator.notification.alert(notification.alert);
						}

						if (notification.sound) {
							//var snd = new Media(event.sound);
							//snd.play();
						}

						if (notification.badge) {

							AppBadgeService.setBadgeNumber(notification.badge)
								.then(function (result) {
									// Success!
								}, function (err) {
									// An error occurred. Show a message to the user
								});
						}
					});

				function _preparePayloadFromAPNSNotification(notification) {
					var notiObj = {
						title: notification.alert,
						message: notification.message
					}, parsedPayload;
					try {
						if (angular.isString(notification.payload)) {
							parsedPayload = JSON.parse(notification.payload);
							notiObj.payload = parsedPayload;
						}
						return notiObj;
					} catch (e) {
						console.error("error parsing notification payload");
						console.error(notification.payload);
						return null;
					}
				}
			}

			function _pickDeviceConfiguration() {
				var pushPreset,
					platform = mobos.Platform.device().platform ? mobos.Platform.device().platform.toLowerCase() : "NA";
				;
				switch (platform) {
					case 'android':
						pushPreset = _.findWhere(pushConfigurationPresets, {platform: PUSH_PLATFORM.ANDROID});
						if (!pushPreset)
							throw 'No push configuration found for platform "' + platform + '"';
						else {
							return pushPreset.config;
						}
						break;

					case 'ios':
						pushPreset = _.findWhere(pushConfigurationPresets, {platform: PUSH_PLATFORM.IOS});
						if (!pushPreset)
							throw 'No push configuration found for platform "' + platform + '"';
						else {
							return pushPreset.config;
						}
						break;

					default:
						throw 'Unrecognised plaform: "' + platform + '"';
						return
				}
			}

			/**
			 * @name waitForNewNotification
			 *
			 * @desc Notify caller of when a new notification arrives.
			 * If the type is specified, the waitee gets notified only if
			 * the given notification type arrives.
			 *
			 * See "NOTIFICATION_TYPE" for more information.
			 *
			 * @param type {String}
			 *
			 * @return Promise Object. The promise is never resolved. only the caller
			 * gets notified as a new notification arrives.
			 */
			function waitForNewNotification(notificationType, key) {
				var deferred = $q.defer();

				_notification_waitingList[key] = {
					notificationType: notificationType,
					deferred: deferred
				};

				return deferred.promise;
			}

			function unWaitForNewNotification(key) {
				if (_notification_waitingList[key]) {
					_notification_waitingList[key].deferred.resolve();
					delete(_notification_waitingList[key]);
				}
			}

			function _notifyNotificationsListeners(notification) {
				//console.log('notifying notification listeners..');
				//console.log(notification);
				var noti_type = _getNotificationType(notification);
				if (_.includes(PUSH_NOTIFICATION_TYPE, noti_type)) {
				} else {
					console.info("unknown notification received..");
					console.log(notification);
					return;
				}
				angular.forEach(_notification_waitingList, function (waitee) {
					if (waitee.notificationType == noti_type) {
						waitee.deferred.notify(notification);
					} else {
					}
				});

				function _getNotificationType(noti) {
					if (noti && noti.payload) {
						return noti.payload.t
					}
				}

			}
		}

		function getNotificationMessage(notification) {
			switch (ionic.Platform.platform()) {
				case 'android':
					return notification.message;

				case 'ios':
					return notification.alert;

				default:
					return "unsupported device platform detected.";
					$scope.error = true;
			}
		}
	}

})();