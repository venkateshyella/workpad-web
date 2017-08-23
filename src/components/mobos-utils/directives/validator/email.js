;
(function () {
  "use strict";

  angular.module("mobos.utils")
    .directive('rhFormEmail', EmailValidatorDirective);

  function EmailValidatorDirective() {
    var EMAIL_REGEXP = /^[a-z0-9_.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?\.([a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
    var EMAIL_REGEXP_2 = /^[_A-Za-z0-9-]+(\.[_A-Za-z0-9-]+)*@[A-Za-z0-9]+(\.[A-Za-z]{2,})$/;

	  /**
	   * Allows alphanumeric name and a valid alpha-numeric domain name.
	   * @type {RegExp}
	   */
	  var EMAIL_REGEXP_3 = /^[_A-Za-z0-9-]+(\.[_A-Za-z0-9-]+)*@([\w-]+\.)+[\w-]{2,4}$/;
    var EMAIL_REGEXP_4 = /^[-a-z0-9~!$%^&*_=+}{\'?-]+(\.[-a-z0-9~!$%^&*_=+}{\'?-]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;



    function postLink(scope, elem, attrs, ctrl) {

      // Email validator
      ctrl.$validators.email = function (modelValue, viewValue) {
        if (ctrl.$isEmpty(modelValue)) {
          // consider empty models to be valid
          return true;
        }

        // Custom email validator
        if (EMAIL_REGEXP_4.test(viewValue)) {
          // it is valid
          return true;
        }

        // it is invalid
        return false;
      };

      // Prevent spaces from entering the input
      elem.bind("keydown keypress", preventSpace);




      scope.$on('$destroy', function() {
        elem.off('keydown keypress', preventSpace);
      });

      function preventSpace(e) {
        if(e.which === 32) {
          event.preventDefault();
        }
      }

    }

    return {
      require: 'ngModel',
      restrict: 'A',
      link: postLink
    }
  }

})();