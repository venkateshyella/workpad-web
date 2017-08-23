;
(function () {

  angular.module('app')
    .controller('UserRegisterViewController', [
      '$scope', '$timeout', 'Connect',
      'blockUI', 'State', 'mDialog',
      'URL', 'Lang','Session','DataProvider',
      UserRegisterViewController]);

  function UserRegisterViewController($scope, $timeout, Connect,
                                      blockUI, State, Dialog,
                                      URL, Lang, Session, DataProvider) {
    var LANG = {};
    

    
    function initScope() {
        "use strict";

      $scope.userInfo = {};
      $scope.form = {};

      $scope.onRegisterClick = function () {
        if ($scope.form.userRegister.$valid && !$scope.isSubmitInProgress) {
          $scope.registerInProgressBlocker = blockUI.instances.get('registerInProgressBlocker');
          if ($scope.registerInProgressBlocker) {
            $scope.registerInProgressBlocker.start("Creating your account");
          }
 		 if (Session.userId) {
			 logoutFromRegister();
		}
          SubmitUserRegistrationForm($scope.userInfo);
        } else {
          console.log($scope.form.userRegister.$error);
          angular.forEach($scope.form.userRegister.$error, function (errorType) {
            "use strict";
            angular.forEach(errorType, function (field) {
              field.$setDirty();
            })
          })
        }
      };

      $scope.isSubmitInProgress = $scope.isSubmitInProgress || false;


      // Toast position.
      $scope.toastPosition = {
        bottom: true,
        top: false,
        left: false,
        right: true
      };
      $scope.getToastPosition = function () {
        return Object.keys($scope.toastPosition)
          .filter(function (pos) {
            return $scope.toastPosition[pos];
          })
          .join(' ');
      };

    }
    
    function logoutFromRegister() {
    	 DataProvider.resource.Preference.destroyAll()
			.then(function (res) {
				console.log(res);
			})
			.catch(function (error) {
				console.log(error);
			});
    }

    function SubmitUserRegistrationForm(userInfo) {
      var registerParams = {
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        email: userInfo.email
      };

      $timeout(function() {
        "use strict";
        $scope.isSubmitInProgress = true;
        console.log(new Date().toTimeString());
      }, 10);

      Connect.post(URL.REGISTER, registerParams)
        .then(function onRegisterSuccess(result) {
          if ($scope.registerInProgressBlocker) {
            $scope.registerInProgressBlocker.stop();
          }
          Dialog.showAlert({
            title: LANG.AUTH.DIALOG.REGISTER_SUCCESS.TITLE,
            content: result.respMsg,
            ok: LANG.BUTTON.OK
          }).then(function () {
            "use strict";
            $scope.isSubmitInProgress = false;
            State.transitionTo('root.login', {}, {
    			FLAGS: {
				CLEAR_STACK: true
			}
    		});
//            $scope.closeDialog();
          });

        }, function onRegisterError(error) {
          if ($scope.registerInProgressBlocker) {
            $scope.registerInProgressBlocker.stop();
          }
          Dialog.showAlert({
            title: LANG.AUTH.DIALOG.REGISTER_ERROR.TITLE,
            content: error.respMsg,
            ok: LANG.AUTH.DIALOG.REGISTER_ERROR.OK_TEXT
          }).then(function() {
            "use strict";
            $scope.isSubmitInProgress = false;
          });
        });
    }
    
	$scope.closeDialog = function(ev) {
		"use strict";
		initScope();
//		Dialog.hide();
		
	};
	
    function run() {
      "use strict";
      initScope();
      LANG = Lang.en.data;
      State.waitForTransitionComplete()
        .then(function() {
          LANG = Lang.en.data;
        })
    }

    run();
  }

})();
