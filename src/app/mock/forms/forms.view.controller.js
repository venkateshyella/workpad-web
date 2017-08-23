/**
 * Created by rihdus on 25/4/15.
 */

;(function() {

  angular.module('app')
    .controller('FormsViewController', FormsViewController);

  function FormsViewController($scope, State) {

    var TAG = '[FormsViewController] ';
    State.waitForTransitionComplete().then(function() {
    })
  }
  FormsViewController.$inject = ['$scope', 'State'];

})();
