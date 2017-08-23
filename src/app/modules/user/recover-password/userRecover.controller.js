;(function () {

  angular.module('app')
    .controller('UserRecoverViewController', [
      '$scope', '$timeout', 'Connect', 'URL',
      'State', 'mDialog', 'Lang',
      UserRecoverController]);

  function UserRecoverController($scope, $timeout, Connect, URL,
                                 State, Dialog, Lang) {
    "use strict";

    var LANG = Lang.en.data;

    function initScope() {
      $scope.userInfo = {
        email: ""
      };
      $scope.form = {};
      $scope.isSubmitInProgress = false;

      $scope.onSubmitRecovery = function () {
        if($scope.form.userRecoverPassword.$dirty
          && $scope.form.userRecoverPassword.$valid) {
          if(!$scope.isSubmitInProgress) {
            submitRecoveryForm();
          }
        } else {

          var errorMsg = "There are some errors in the form";

          Dialog.showAlert({
            title: LANG.AUTH.DIALOG.RECOVERY_PASSWORD.TITLE,
            content: errorMsg,
            ok: LANG.BUTTON.OK
          });
        }
      }
    }

    function submitRecoveryForm() {
      $scope.isSubmitInProgress = true;
      Connect.post(URL.RECOVER, {
        userEmail: $scope.userInfo.email
      }).then(function onSubmitSuccess(result) {
        Dialog.showAlert({
          title: LANG.AUTH.DIALOG.RECOVERY_PASSWORD.TITLE,
          content: result.respMsg || LANG.AUTH.DIALOG.RECOVERY_PASSWORD.BODY_SUCCESS,
          ok: LANG.BUTTON.OK
        }).then(function() {
          initScope();
          $scope.closeDialog();
        });
      }, function onSubmitError(error) {
        console.log(error);
        $scope.isSubmitInProgress = false;
        Dialog.showAlert({
          title: LANG.AUTH.DIALOG.RECOVERY_PASSWORD.TITLE,
          content: error.respMsg || LANG.AUTH.DIALOG.RECOVERY_PASSWORD.BODY_ERROR,
          ok: LANG.BUTTON.OK
        }).then(function() {
        //  Do Nothing.
        });
      })
    }

	$scope.closeDialog = function(ev) {
		"use strict";
		initScope();
		Dialog.hide();
	};
    function run() {
      "use strict";
      initScope();
    }
    run();

  }

})();