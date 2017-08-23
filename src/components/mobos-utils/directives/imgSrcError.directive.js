;
(function () {
  "use strict";

  angular.module('mobos.utils')
    .directive('onErrorSrc', function () {
      return {
        link: function (scope, element, attrs) {
          element.bind('error', function () {
            if (attrs.src != attrs.onErrorSrc) {
              attrs.$set('src', attrs.onErrorSrc);
            }
          });
        }
      }
    });
})();