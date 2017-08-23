/**
 * Created by rihdus on 14/4/15.
 */

;(function() {
	"use strict";

	angular.module('InterimComponent')
		.service('SimpleDialog', SimpleDialogProvider);

	function SimpleDialogProvider() {

    function SelectDialogProvider() {

      var config = {
        templateUrl: ""
      };

      return {
        $get: SelectDialogService
      };

      function SelectDialogService() {}

    }

	}
  SimpleDialogProvider.$inject=[]

})();

