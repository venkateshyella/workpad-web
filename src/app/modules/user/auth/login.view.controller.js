//auth-controller.js

(function () {

	angular.module('app')
	.controller('LoginViewController', [
	                                    '$scope','$rootScope',
	                                    'RouteResolver',
	                                    '$mdDialog','$mdMedia','State',
	                                    'Session', 'APP_INFO', LoginViewController]);

	function LoginViewController($scope,$rootScope,
			RouteResolver,
			Dialog, $mdMedia,State,
			Session, APP_INFO) {

		function _authStart() {
			$scope.authInProgress = true;
		}

		function _onAuthFinish(res) {
			"use strict";
			$scope.authInProgress = false;
			var nextState = RouteResolver.resolveFirstState();
			State.transitionTo(nextState.name, nextState.params, {
				FLAGS: {
					CLEAR_STACK: true
				}
			});
		}

		function _onAuthError(){
			$scope.authInProgress = false;
		}

		$scope.APP_INFO = APP_INFO;

		$scope.action = {
				onAuthStart: _authStart,
				onAuthFinish: _onAuthFinish,
				onAuthError: _onAuthError
		};

		function runForgotPassword() {
			"use strict";
			Dialog.show({
				scope:$scope,  
				preserveScope: true,
				parent: angular.element(document.body),
				templateUrl: 'app/modules/user/recover-password/recover-password.view.html',
				controller: 'UserRecoverViewController',
				clickOutsideToClose:false
			});
		}

		$scope.onUserRegisterClick = function (ev) {
			
     		State.transitionTo('root.register', {}, {
    			FLAGS: {
				CLEAR_STACK: true
			}
    		});

     		/*		
			"use strict";
			Dialog.show({
				scope:$scope,  
				preserveScope: true,  
				parent: angular.element(document.body),
				templateUrl: 'app/modules/user/register/register.view.html',
				controller: 'UserRegisterViewController',
				clickOutsideToClose:false
			});
			*/
		};
		

		$scope.runForgotPassword = runForgotPassword;

	}

	//LoginViewController.$inject = [];

})();
