/**
 * Created by sudhir on 1/7/15.
 */

;
(function () {
  "use strict";

  angular.module('app.services')
    .service('Subscribe', ['$rootScope', '$q', '$timeout',
      'PushNotificationService', 'SettingsServices', 'Connect',
      'URL', 'PUSH_PLATFORM', 'PUSH_PREFERENCES', SubscribeService]);

  function SubscribeService($rootScope, $q, $timeout, PushNotificationService, SettingsServices,
                            Connect, URL, PUSH_PLATFORM, PUSH_PREFERENCES) {

    var PUSH_PREF_REV_MAP = _.invert(PUSH_PREFERENCES);

    return {
      sendSubscription: sendSubscription,
      updateSubscription: updateSubscription,
      sendPushPreferencesUpdate: sendPushPreferencesUpdate,
      fetchPushPreferences: fetchPushPreferences
    };

    function sendPushPreferencesUpdate(pushPrefSettings) {
      var catId = PUSH_PREFERENCES[pushPrefSettings.type];
      var enabled = pushPrefSettings.enabled;
      var pushPrefPayload = {
        catId: catId,
        active: enabled
      };
      return Connect.post(URL.PUSH_NOTI_PREF_UPDATE, pushPrefPayload)
    }

    function fetchPushPreferences() {
      var pushPrefObj = {};
      return Connect.get(URL.FETCH_PUSH_NOTI_PREF)
        .then(function (result) {
          var pushSettings = result.resp || [];
          _.each(pushSettings, function (setting) {
            var prefName = PUSH_PREF_REV_MAP[setting.catId];
            var val = setting.active;
            pushPrefObj[prefName] = val;
          });
          var savedSettingsData = SettingsServices.get('pushPref');
          savedSettingsData.value = pushPrefObj;
          return SettingsServices.update('pushPref', savedSettingsData);
        })
    }

    /**
     *
     *
     *
     * @param subscriptionUpdateData
     *        {
     *          enabled: {true|false}
     *        }
     * @returns {promise.promise|Function|*|jQuery.promise}
     */
    function updateSubscription(subscriptionUpdateData) {
      var deferred = $q.defer();
      var subscriptionData;
      var savedPushSettings = SettingsServices.get('push') && SettingsServices.get('push').value || {};
      if (!subscriptionUpdateData) {
        subscriptionData = SettingsServices.get('push') && SettingsServices.get('push').value || {};
      } else {
        subscriptionData = subscriptionUpdateData
      }

      if (subscriptionData) {
        if (subscriptionData.enabled) {
         // if (mobos.Platform.isWebView()) {
            console.info("registering for push notifications..");
            PushNotificationService.register()
              .then(function (res) {
                var deviceRegistration = PushNotificationService.getRegistration();
                console.log(deviceRegistration);
                var subscriptionSettings = {
                    isEnabled: true
                  },
                  registration = {
                    key: deviceRegistration.key
                  }
                  ;
                sendSubscription(registration)
                  .then(function (res) {
                    console.log(res);
                    deviceRegistration.subscriptionId = res.resp.id;
                    savedPushSettings.subscription = res.resp;
                    SettingsServices.update('push', savedPushSettings);
                    PushNotificationService.updateRegistration(deviceRegistration);
                    deferred.resolve(res);
                  })
                  .catch(function (error) {
                    deferred.reject(error);
                  });
                //PushNotificationService.updateRegistration({
                //  deviceToken: res
                //});
              })
              .catch(function (error) {
                deferred.reject(error);
              });
         /* } else {
            deferred.reject({
              respMsg: "not a webview"
            });
          }
          */
        } else {
          var deviceRegistration = PushNotificationService.getRegistration();
          if (deviceRegistration) {
            removeSubscription(deviceRegistration)
              .then(function (res) {
                deferred.resolve(res);
              }).catch(function (error) {
              deferred.reject(error);
            });
          }
        }
      }
      return deferred.promise;
    }

    /*
     *
     * Request format:
     *
     * "deviceId": "device id",
     * "platform": "<android, ios>",
     * "key": "GCM/APNS registration key."
     *
     * */

    function sendSubscription(registration) {
      var deferred = $q.defer();

      var pushSubscriptionData = preparePushSubscriptionData();
      var platform = mobos.Platform.device().platform;
      switch (platform) {
        case 'Android':
          pushSubscriptionData.key = registration.key;
          break;

        case 'iOS':
          pushSubscriptionData.key = registration.key;
          break;

        default:
          // Invalid platform
          console.error("Invalid platform..");
          deferred.reject({
            respMsg: "Invalid platform."
          });
          return deferred.promise;

      }

      console.log(pushSubscriptionData);

      Connect.post(URL.PUSH_NOTI_SUBSCRIBE, pushSubscriptionData)
        .then(function (resp) {
          deferred.resolve(resp)
        })
        .catch(function (error) {
          deferred.reject(error);
        });

      return deferred.promise;
    }

    function removeSubscription(registration) {
      var deferred = $q.defer();
      var deviceId = mobos.Platform.device().uuid;

      if (registration && registration.subscriptionId) {
        Connect.post(URL.PUSH_NOTI_UNSUBSCRIBE, {
            deviceId: deviceId
          })
          .then(function (resp) {
            deferred.resolve(resp)
          })
          .catch(function (error) {
            deferred.reject(error);
          });
      } else {
        deferred.resolve();
      }
      return deferred.promise;
    }

    function preparePushSubscriptionData() {
      var deviceId = mobos.Platform.device().uuid,
        platform
        ;
      if (mobos.Platform.isAndroid()) {
        platform = PUSH_PLATFORM.ANDROID;
      } else if (mobos.Platform.isIOS()) {
        platform = PUSH_PLATFORM.IOS
      }

      return {
        deviceId: deviceId,
        platform: platform
      }
    }

  }

})();