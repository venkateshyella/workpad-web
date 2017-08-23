/**
 * Created by sudhir on 15/6/15.
 */


;
(function () {
  "use strict";

  angular.module('mobos.utils')
    .config([
      'PushNotificationServiceProvider', 'PUSH_PLATFORM',
      function PushNotificationServiceConfig(PushNotificationServiceProvider, PUSH_PLATFORM) {


        PushNotificationServiceProvider.configureNewDevicePreset('ww_android', PUSH_PLATFORM.ANDROID, {
          senderID: "477414499655"
        });

        PushNotificationServiceProvider.configureNewDevicePreset('ww_ios', PUSH_PLATFORM.IOS, {
          "badge": true,
          "sound": true,
          "alert": true
        });

      }])
  ;

})();