/**
 * Created by sudhir on 11/5/15.
 */

;(function() {

  angular.module('app.services')
    .service('Ping', PingService);

  function PingService($q, $timeout, Connect, URL) {

    var service = {
      send: function() {
        return $timeout(function() {
          return _ping();
        }, 60);
      }
    };

    return service;

    function _ping() {
      "use strict";
      var deferred = $q.defer();

      function onPingFail(reason) {
        deferred.reject(reason)
      }

      function sendPingRequest() {
        Connect.get(URL.PING, {}).then(function onPingReqSuccess(result) {
          var pingData = result.resp;
          if (angular.isObject(pingData)) {
            deferred.resolve(pingData);
          } else {
            // Incorrect response.
            // Retry indefinitely.
            onPingFail(result.resp);
          }
        }, function onPingReqError(error) {
          // Ping request failed.
          // Retry indefinitely.
          onPingFail(error);
        });
      }

      sendPingRequest();
      return deferred.promise;
    }

  }
  PingService.$inject = ['$q', '$timeout', 'Connect', 'URL'];

})();