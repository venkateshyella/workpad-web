/**
 * Created by rihdus on 26/4/15.
 */

;(function() {

  angular.module('mobos.event', [])
    .directive('onLongPress', [
      '$timeout',
      OnLongPress]);

  function OnLongPress($timeout) {
    return {
      restrict: 'A',
      link: function($scope, $elm, $attrs) {
        $elm.bind('touchstart', function(evt) {
          // Locally scoped variable that will keep track of the long press
          $scope.longPress = true;

          // We'll set a timeout for 600 ms for a long press
          $timeout(function() {
            if ($scope.longPress) {
              // If the touchend event hasn't fired,
              // apply the function given in on the element's on-long-press attribute
              evt.preventDefault();
              $scope.$apply(function() {
                $scope.$eval($attrs.onLongPress)
              });
            }
          }, 300);
        });

        $elm.bind('touchend', function(evt) {
          // Prevent the onLongPress event from firing
          $scope.longPress = false;
          evt.preventDefault();
          // If there is an on-touch-end function attached to this element, apply it
          if ($attrs.onTouchEnd) {
            $scope.$apply(function() {
              $scope.$eval($attrs.onTouchEnd)
            });
          }
        });
      }
    };
  }

})();
