/**
 * Created by sudhir on 25/5/15.
 */

;
(function () {
  "use strict";

  angular.module('app.debug', [])
    .controller('DebugController', DebugController)
    .controller('debugEndPointDialogController', debugEndPointDialogController)
  ;

  function DebugController($scope, Dialog,
                           DataProvider,
                           URL, BASE_URL, BOSH_ENDPOINT,
                           SAVED_PREFERENCES_KEY) {

    $scope.endpoint = {
      showServiceUrlDebug: debugServiceEndPoint,
      currBaseUrl: URL.BASE_URL,
      currBoshEndpoint: URL.BOSH_SERVICE_ENDPOINT
    };

    function debugServiceEndPoint() {
      Dialog.show({
        controller: 'debugEndPointDialogController',
        templateUrl: 'app/debug/template/dialog/debug-endpoint.dialog.tpl.html'
      }).then(function (result) {
        switch (result.action) {
          case 'update':
            URL.resetBaseUrl(result.data.baseUrl);
            DataProvider.resource.Preference.create({
              id: SAVED_PREFERENCES_KEY.BASE_URL,
              value: result.data.baseUrl
            }).then(function() {
              //window.location.reload();
              DataProvider.resource.Preference.create({
                id: SAVED_PREFERENCES_KEY.BOSH_ENDPOINT,
                value: result.data.boshEndpoint
              }).then(function() {
                window.location.reload();
              });
            });
            break;

          case 'reset':
            URL.resetBaseUrl(BASE_URL, BOSH_ENDPOINT);
            break;
        }
      })
    }

    function debugBoshEndPoint() {

    }

  }

  DebugController.$inject = ['$scope', 'mDialog',
    'DataProvider',
    'URL', 'BASE_URL', 'BOSH_ENDPOINT', 'SAVED_PREFERENCES_KEY'];

  function debugEndPointDialogController($scope, $mdDialog, URL) {

    $scope.baseUrl = URL.BASE_URL + '';
    $scope.boshEndpoint = URL.BOSH_SERVICE_ENDPOINT+ '';

    $scope.reset = function () {
      $mdDialog.hide({
        action: 'reset',
        data: {}
      });
    };

    $scope.update = function (endpoint, boshEndpoint) {
      $mdDialog.hide({
        action: 'update',
        data: {
          baseUrl: endpoint,
          boshEndpoint: boshEndpoint
        }
      })
    };

    $scope.cancel = $mdDialog.cancel;
  }

  debugEndPointDialogController.$inject =
    [
      '$scope', '$mdDialog',
      'URL'
    ]

})();