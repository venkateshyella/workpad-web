/**
 * Created by sudhir on 15/5/15.
 */

;
(function () {
  "use strict";

  var app = angular.module('app.settings')

    .controller('SettingsListViewController', [
      '$scope', '$rootScope', '$mdToast', '$timeout',
      'mDialog', 'blockUI',
      'SettingsServices', 'Subscribe', 'PushNotificationService',
      'SAVED_PREFERENCES_KEY', 'APP_BROADCAST', 'Lang',
      SettingsListViewController])
    ;

  function SettingsListViewController($scope, $rootScope, $mdToast, $timeout
    , Dialog, blockUI
    , SettingsServices, Subscribe, PushNotificationService
    , SAVED_PREFERENCES_KEY, APP_BROADCAST, Lang) {

    var LANG = Lang.data;
    $scope.form = {};
    $scope.state = {
      isLoadingPushPrefs: false,
      isLoadedPushPrefs: false
    };
    $scope.LANG_SETTINGS = LANG.SETTINGS;
    $scope.settingsData = angular.copy(SettingsServices.getAll());
    $scope.settingStatus = {};
    $scope.onChange = onSettingChange;
    $scope.onPushNotificationChange = onPushNotificationChange;
    $scope.fetchPreferences = fetchPreferences;
    $scope.isPushSettingsEnabled = isPushSettingsEnabled;

    init();

    function init() {
      fetchPreferences();
      $timeout(function () {
//        $scope.form.settings.push.$pending = false;
      }, 500);
    }

    function isPushSettingsEnabled() {

      return $scope.settingsData.push.value.enabled
        && !$scope.form.settings.push.$pending
        && $scope.state.isLoadedPushPrefs
        // && !$scope.state.isLoadingPushPrefs
        // && !$scope.form.settings.pushPrefInvitation.$pending
        // && !$scope.form.settings.pushPrefChat.$pending
        // && !$scope.form.settings.pushPrefData.$pending
        ;
    }

    function fetchPreferences() {
      blockUI.start();
      $scope.state.isLoadingPushPrefs = true;
      Subscribe.fetchPushPreferences()
        .then(function () {
          $scope.settingsData = angular.copy(SettingsServices.getAll());
          $scope.state.isLoadedPushPrefs = true;
        })
        .catch(function () {
          $scope.state.isLoadedPushPrefs = false
        })
        .finally(function () {
          blockUI.stop();
          $scope.state.isLoadingPushPrefs = false;
        });
    }

    function onSettingChange(name) {

      switch (name) {
        case 'push':
          var savedPushData = SettingsServices.get('push')
            , scopeSettingsForm = $scope.form.settings
            ;
          scopeSettingsForm.push.$pending = true;
          updateSubscription({
            enabled: $scope.settingsData.push.value.enabled
          })
            .then(function () {
              return savePushSettings()
                .then(function (res) {
                  var msg = res.respMsg || "Subscription updated";
                  $timeout(function () {
                    $mdToast.show(msg);
                    //$scope.settingStatus.pushNotification = msg;
                  }, 100);
                })
                .catch(function (err) {
                })
                ;
            })
            .catch(function (error) {
              // rollback push value to saved setting value.
              var msg = error && error.respMsg || "Failed updating subscription.";
              $scope.settingsData.push.value.enabled = savedPushData.value.enabled;
              $scope.settingStatus.pushNotification = msg;
              Dialog.alert(msg);
            })
            .finally(function () {
              $timeout(function () {
                scopeSettingsForm.push.$pending = false;
              }, 1000);
            })
          ;
          break;

        case 'invitation':
        case 'chat':
        case 'data':
          $scope.form.settings.pushPrefInvitation.$pending = true;
          $scope.form.settings.pushPrefChat.$pending = true;
          $scope.form.settings.pushPrefData.$pending = true;
          var isEnabled = $scope.settingsData.pushPref.value[name];
          var type = name;
          updatePushPreferences({
            type: type,
            enabled: isEnabled
          })
            .then(function () {

            })
            .finally(function () {
              $scope.form.settings.pushPrefInvitation.$pending = false;
              $scope.form.settings.pushPrefChat.$pending = false;
              $scope.form.settings.pushPrefData.$pending = false;
            });
          break;
        default:
      }
    }

    function onPushNotificationChange(value) {
      return Subscribe.updateSubscription(value);
    }

    function updateSubscription() {
      var notificationSubscriptionUpdateData = {
        enabled: $scope.settingsData.push.value.enabled
      };
      $scope.settingStatus.pushNotification = "Updating your push subscription";
      return Subscribe.updateSubscription(notificationSubscriptionUpdateData);
    }

    function updatePushPreferences(pushPreferenceData) {
      return Subscribe.sendPushPreferencesUpdate(pushPreferenceData);
    }

    function savePushSettings() {
      var isEnabled = $scope.settingsData.push.value.enabled;
      var savedPushSettings = SettingsServices.get('push').value || {};
      savedPushSettings.enabled = isEnabled;
      return SettingsServices.update('push', savedPushSettings);
    }
  }

})();