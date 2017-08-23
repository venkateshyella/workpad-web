;
(function () {
  "use strict";

  angular.module('mobos.utils')
    .directive('onloadHideLoader', function () {
                                  var directive = {
                                      link: link,
                                      restrict: 'A'
                                  };
                                  return directive;

                                  function link(scope, element, attrs) {
                                	  if (attrs.onloadHideLoader) {
                                          $("#"+attrs.onloadHideLoader).hide();
                                        }
                                  }
                              }
                          );
})();