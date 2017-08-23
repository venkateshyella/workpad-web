/**
 * Created by sudhir on 16/6/15.
 */

;(function () {
  "use strict";

  angular.module('app').config([
    'SettingsServicesProvider', 'SAVED_PREFERENCES_KEY',
    SettingsConfig]);

  function SettingsConfig(SettingsServicesProvider, SAVED_PREFERENCES_KEY) {

    SettingsServicesProvider.newSetting(SAVED_PREFERENCES_KEY.PUSH_NOTIFICATION,
      'push',
      {
        enabled: true
      });

    SettingsServicesProvider.newSetting(SAVED_PREFERENCES_KEY.PUSH_NOTIFICATION,
      'pushPref',
      {
        invitation: true,
        chat: true,
        data: true
      });

    SettingsServicesProvider.newSetting(SAVED_PREFERENCES_KEY.USER, 'user', {});
  }

})();