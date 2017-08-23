/**
 * Created by sudhir on 13/7/15.
 */

;(function() {
  "use strict";

  angular.module('app')
    .controller('AppLoggerViewController', AppLoggerViewController)
  ;

  function AppLoggerViewController($scope, AppLogger) {

    $scope.logData = AppLogger.logBucket;
    angular.forEach($scope.logData, function (log) {
      log.displayTime = new Date(log.ts).toLocaleTimeString();
    })

  }

})();
