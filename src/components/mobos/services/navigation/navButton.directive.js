/**
 * Created by sudhir on 24/4/15.
 */

;(function() {

  angular.module('Navigator')
    .directive('navButton', NavigationButtonDirective);

  function NavigationButtonDirective(State) {

    function preLink(scope, elem, attrs) {
    }

    function postLink(scope, elem, attrs) {
    }

    return {
      restrict: 'A',
      link: {
        pre: preLink,
        post: postLink
      }
    }

  }
  NavigationButtonDirective.$inject=['State'];

})();
