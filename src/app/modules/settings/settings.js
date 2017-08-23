/**
 * Created by sudhir on 16/6/15.
 */


;
(function () {
  "use strict";

  var app = angular.module('app.settings', [])

      .provider('SettingsServices', [
        SettingsServices])

      .directive('validateChange', [
        '$q',
        ValidateChangeDirective])
    ;

  function SettingsServices() {

    var settingsFile = {},
      settingStore
      ;

    return {
      $get: ['DataProvider', SettingsServiceApi],
      newSetting: newSetting
    };

    function SettingsServiceApi(DataProvider) {

      settingStore = DataProvider.resource.Preference;

      return {
        store: settingStore,
        get: get,
        getAll: getAll,
        update: update,
        initialize: initialize
      };

      function initialize() {
        angular.forEach(settingsFile, function (setting, index) {
          var savedSetting = settingStore.get(index);
          if(!savedSetting) {
            // Setting not found in store.
            // Write default settings to settings store.
            settingStore.update(setting.name, {
              id: setting.name,
              value: setting.value
            }).then(function() {

            })
          }
          angular.extend(setting, savedSetting);
        });
      }

      function update(name, settingRecord) {
        var data = angular.copy(settingStore.get(name) || {});
        data.id = name;
        angular.extend(data, settingRecord);
        return settingStore.update(name, data);
      }

      function get(name) {
        settingsFile[name] = settingStore.get(name);
        return settingsFile[name];
      }

      function getAll() {
        return settingsFile;
      }
    }

    function newSetting(key, name, value) {
      var value = value || {};
      settingsFile[name] = {
        name: name,
        key: key,
        value: value
      };
    }
  }

  function ValidateChangeDirective($q) {
    return {
      require: 'ngModel',
      scope: {
        validateChangeWith: '&'
      },
      link: function (scope, elm, attrs, ctrl) {

        ctrl.$asyncValidators.validateChange = function (modelValue, viewValue) {

          var old_value = modelValue;
          var defer = $q.defer();

          scope.validateChangeWith()
            .then(function (isOk) {
              modelValue = isOk;
              defer.reject(isOk);
            }).catch(function(error) {
              modelValue = error.value || old_value;
              defer.reject(error);
            })
          ;

          return defer.promise;
        };

      }
    };
  }

})();