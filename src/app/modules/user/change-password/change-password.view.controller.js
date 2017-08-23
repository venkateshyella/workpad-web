/**
 * Created by sudhir on 15/5/15.
 */


;
(function () {
  "use strict";

  //changePassword.controller.js

  angular.module('app')
    .controller('ChangePasswordViewController', [
      '$scope', 'URL', 'Connect', 'Session', '$timeout',
      'State', 'mDialog', 'Lang',
      'Securify', 'AppLogger',
      'UserService', ChangePasswordViewController]);

  function ChangePasswordViewController($scope, URL, Connect, Session, $timeout,
                                        State, Dialog, Lang,
                                        Securify, AppLogger,
                                        UserService) {

    var LANG = Lang.en.data;

    function initScope() {
      $scope.form = {
        changePassword: {
          fields: {
            oldPassword: "",
            newPassword: "",
            confirmPassword: ""
          },
          action: {
            onSubmitButtonClick: function () {
              if (!$scope.form.changePasswordForm.$valid) {
              } else {
                if (!$scope.form.changePassword.stateinProgress)
                  submitChangePassword();
              }
            }
          },
          state: {
            inProgress: false
          }
        }
      }
    }

    function run() {

      initScope();
    }
    
    $scope.cancel = function() {
		"use strict";
		initScope();
		Dialog.hide();
		
	};

    function sanitizeChangePasswordForm() {
      $scope.form.changePassword.fields.newPassword = $scope.form.changePassword.fields.newPassword.trim();
      $scope.form.changePassword.fields.oldPassword = $scope.form.changePassword.fields.oldPassword.trim();

    }

    function submitChangePassword() {
      $scope.submitChangePassword_inProgress = true;
      sanitizeChangePasswordForm();
      var postData = {
        userEmail: Session.userInfo.userEmail,
      };
      AppLogger.log("start encryption for new password");
      postData.userPassword = Securify.encrypt($scope.form.changePassword.fields.newPassword, 'pef');
      AppLogger.log("end encryption for new password");
      AppLogger.log("start encryption for old password");
      postData.oldPassword = Securify.encrypt($scope.form.changePassword.fields.oldPassword, 'pef')
      AppLogger.log("end encryption for old password");
      AppLogger.log("send change-password request");
      Connect.post(URL.UPDATE_PASSWORD, postData)
        .then(function onChangePasswordSuccess(res) {
          AppLogger.log("change-password response");
          Dialog.showAlert({
            title: LANG.AUTH.DIALOG.UPDATE_PASSWORD_SUCCESS.TITLE,
            content: res.respMsg + LANG.AUTH.DIALOG.UPDATE_PASSWORD_SUCCESS.CONTENT_POSTFIX,
            ok: LANG.AUTH.DIALOG.UPDATE_PASSWORD_SUCCESS.OK_TEXT
          }).then(function () {
            initScope();
            AppLogger.log("change-password error");
            // Clear saved credentials if any.
            UserService.updateProfileData({
              password: "",
              autoLogin: false
            });

            // Reload app
            window.location.reload();
          });
        }, function onChangePasswordError(error) {
          Dialog.showAlert({
            title: LANG.AUTH.DIALOG.UPDATE_PASSWORD_ERROR.TITLE,
            content: error.respMsg,
            ok: LANG.AUTH.DIALOG.UPDATE_PASSWORD_SUCCESS.OK_TEXT
          }).then(function () {
            $scope.submitChangePassword_inProgress = false;
          }).finally(function () {
            $scope.submitChangePassword_inProgress = false;
          });
          console.log("password change failed")
        })
    }
    


    run();

  }
  ;

})();