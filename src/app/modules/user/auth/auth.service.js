// Auth.Services.js

;
(function () {

  var Auth = angular.module("Auth");

  Auth.factory('AuthService', [
    "$rootScope", "$http", "Session", "$q", "$timeout",
    "Connect", "Securify", 'AppLogger',
    "AUTH_EVENTS", "SESSION_STATUS", "URL","DataProvider","mDialog",
    function ($rootScope, $http, Session, $q, $timeout,
              Connect, Securify, AppLogger,
              AUTH_EVENTS, SESSION_STATUS, URL, DataProvider,Dialog) {
      var authService = {};

      var _authPromiseBucket = {};

      var _sessionPromiseList = {};

      function _responseParser(resp) {
      }

      function _setNewSession(sessionId, userId, role, user) {
        Session.create(sessionId, userId, role, user);

        angular.forEach(_sessionPromiseList, function (defer, index) {
          defer.resolve();
        });

        angular.forEach(_sessionPromiseList, function (defer, index) {
          delete(_sessionPromiseList[index]);
        });
      }
      
      /** 
       * save authentication response data to 
       * local storage
       */
      function _saveAuthResponseData(authResponse){

          var _deferred = $q.defer();
          
          DataProvider.resource.Preference.create({
            id: "_userAuthResponse",
            name: "user",
            value_type: 'string',
            data: authResponse
           
          }).then(function onAuthResponseSaveSuccess(result) {
            _deferred.resolve(result);
          }, function onAuthResponseSaveError(error) {
            _deferred.reject(result);
            console.log(error);
          });
          return _deferred.promise;
      }

      authService.onNewSession = function (key) {
        var _defer = $q.defer();
        _key = key || 'default';
        if (_sessionPromiseList[key]) {
          delete(_sessionPromiseList[key])
        }
        _sessionPromiseList[_key] = _defer;
        return _defer.promise;
      };

      authService.runAuthFlow = function (creds, options) {
        var _options = options || {};

        var _defer = _options.defer || $q.defer();

        function _resolve(args) {
          if (_options.defer) {
            _defer.notify(args);
          } else {
            _defer.resolve(args);
          }
        }

        function _notify(args) {
          _defer.notify(args);
        }

        function _reject(args) {
          if (_options.defer) {
            _defer.notify(args);
          } else {
            _defer.reject(args);
          }
        }

        // $timeout(function() {
        // 	_resolve(SESSION_STATUS.VALID);
        // }, 500);

        authService.submitLogin(creds);

        return _defer.promise;
      };

      authService.submitLogin = function (credentials, options) {
        function _updateAuthStatus(auth_events, promiseParam) {
          switch (auth_events) {
            case AUTH_EVENTS.loginSuccess:
              $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
              while (_authPromiseBucket.length > 0) {
                var authPromise = _authPromiseBucket.pop();
                authPromise.resolve(promiseParam);
              }
              break;

            case AUTH_EVENTS.loginFailed:
              $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
              while (_authPromiseBucket.length > 0) {
                var authPromise = _authPromiseBucket.pop();
                authPromise.reject(promiseParam);
              }
              break;

            case AUTH_EVENTS.loginInProgress:
              $rootScope.$broadcast(AUTH_EVENTS.loginInProgress, promiseParam);
              for (var i = 0; i < _authPromiseBucket.length; i++) {
                _authPromiseBucket[i].notify(promiseParam);
              }
              ;
              break;
          }
        }

        var _options = options || {};
        var _defer = _options.defer || $q.defer();
        _updateAuthStatus(AUTH_EVENTS.loginInProgress, {
          status: true
        });

        $rootScope.sessionCred = credentials;
        
        AppLogger.log('Send Login request');
        Connect.post(URL.LOGIN, {
          userEmail: credentials.username,
          userPassword: credentials.password
        }, _defer)
          .then(function onAuthSuccess(result) {
            AppLogger.log('Login success response');
            _setNewSession(result.resp.sessionId,
              result.resp.userEntity.id, 'USER', result.resp.userEntity);

            _saveAuthResponseData(result.resp); 
            
            _updateAuthStatus(AUTH_EVENTS.loginInProgress, {
              status: false
            });
          }, function onAuthError(error) {
            AppLogger.log('Login error response');
            console.log(error);
            // _setNewSession("id", {username: "username"});
            _updateAuthStatus(AUTH_EVENTS.loginInProgress, {
              status: false
            });
            _defer.reject(error)
          }, function onAuthNoti(noti) {
            console.log(noti);
            _defer.notify(noti);
          });
        return _defer.promise;
      }

      authService.logout = function (userInfo, options) {
        var _userInfo = userInfo;
        var _options = options || {};
        var _defer = _options.defer || $q.defer();
        $timeout(function () {
          Connect.get(URL.LOGOUT, {}, _defer)
            .then(function onReqRecoverySuccess(result) {
              _defer.resolve(result);
            }, function onReqRecoveryFailed(error) {
              _defer.reject(error);
            }, function onReqRecoveryNoti(noti) {
              _defer.notify(noti);
            });
        }, 10);
        return _defer.promise;
      };

      authService.isAuthenticated = function () {
        return !!Session.userId;
      };

      authService.reqRecovery = function (userIdentity, options) {
        var _options = options || {};
        var _defer = _options.defer || $q.defer();

        $timeout(function () {
          Connect.post(URL.RECOVER, {
            userEmail: userIdentity.email
          }, _defer)
            .then(function onReqRecoverySuccess(result) {
              _defer.resolve(result);
            }, function onReqRecoveryFailed(error) {
              _defer.reject(error);
            }, function onReqRecoveryNoti(noti) {
              _defer.notify(noti);
            });
        }, 10);

        return _defer.promise;
      };

      authService.submitRegistrationForm = function (userInfo, options) {
        var _userInfo = userInfo;
        var _options = options || {};
        var _defer = _options.defer || $q.defer();
        $timeout(function () {
          Connect.post(URL.REGISTER, {
            email: _userInfo.email,
            firstName: _userInfo.firstName,
            lastName: _userInfo.lastName,
            // userPassword: _userInfo.password,
            // userConfirmPassword: _userInfo.password_confirm,
          }, _defer);
        }, 10);

        return _defer.promise;
      };

      authService.resetPassword = function (resetData, options) {
        var _options = options || {};
        var _defer = _options.defer || $q.defer();
        var _resetData = resetData;
        $timeout(function () {
          Connect.post(URL.UPDATE_PASSWORD, {
            userTempPassword: _resetData.token,
            userPassword: _resetData.newPassword,
            userConfirmPassword: _resetData.newPassword_confirm,
          }, _defer)
            .then(function onReqRecoverySuccess(result) {
              _defer.resolve(result);
            }, function onReqRecoveryFailed(error) {
              _defer.reject(error);
            }, function onReqRecoveryNoti(noti) {
              _defer.notify(noti);
            });
        }, 10);

        return _defer.promise;
      };
      
      authService.webAutoLogin = function (authResponseData, options) {
          function _updateAuthStatus(auth_events, promiseParam) {
            switch (auth_events) {
              case AUTH_EVENTS.loginSuccess:
                $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
                while (_authPromiseBucket.length > 0) {
                  var authPromise = _authPromiseBucket.pop();
                  authPromise.resolve(promiseParam);
                }
                break;

              case AUTH_EVENTS.loginFailed:
                $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
                while (_authPromiseBucket.length > 0) {
                  var authPromise = _authPromiseBucket.pop();
                  authPromise.reject(promiseParam);
                }
                break;

              case AUTH_EVENTS.loginInProgress:
                $rootScope.$broadcast(AUTH_EVENTS.loginInProgress, promiseParam);
                for (var i = 0; i < _authPromiseBucket.length; i++) {
                  _authPromiseBucket[i].notify(promiseParam);
                }
                ;
                break;
            }
          }

          var _options = options || {};
          var _defer = _options.defer || $q.defer();
          _updateAuthStatus(AUTH_EVENTS.loginInProgress, {
            status: true
          });

        /*  AppLogger.log('Send Login request');
          Connect.post(URL.LOGIN, {
            userEmail: credentials.username,
            userPassword: credentials.password
          }, _defer)
            .then(function onAuthSuccess(result) {
              
            }, function onAuthError(error) {
              AppLogger.log('Login error response');
              console.log(error);
              // _setNewSession("id", {username: "username"});
              _updateAuthStatus(AUTH_EVENTS.loginInProgress, {
                status: false
              });
              _defer.reject(error)
            }, function onAuthNoti(noti) {
              console.log(noti);
              _defer.notify(noti);
            });
            */
          
          AppLogger.log('Auto Login success response');
          _setNewSession(authResponseData.data.sessionId,
        		  authResponseData.data.userEntity.id, 'USER', authResponseData.data.userEntity);
          _updateAuthStatus(AUTH_EVENTS.loginInProgress, {
            status: false
          });
          
          _defer.resolve();
          
          return _defer.promise;
        }
      
      
      authService.autoLoginAfterSessionExpire = function(){
		"use strict";
		var _deferred = $q.defer();
		var data = {
			username: $rootScope.sessionCred.username,
			password: $rootScope.sessionCred.password
		};
		
		
		authService.submitLogin(data)
			.then(function (result) {
				//console.log(result);
				if ( data.username && data.password) {
					authService.saveProfileData({
						username: data.username,
						password: data.password,
						autoLogin: true
					})
				}
				
				_deferred.resolve(result);
				
			}, function onLoginError(error) {
				Dialog.showAlert({
					//title: LANG.DIALOG.AUTH_FAIL.TITLE,
					title: "Authentication Faiure",
					content: error.respMsg,
					ok: "OK"
				});
				
				_deferred.resolve(error);
			});
		
		 return _deferred.promise;
      };

      authService.getSessionCredentials = function(){
    	  return $rootScope.sessionCred;
      };
      
      authService.isSessionExpired = function(){
    	return  localStorage.getItem("sessionExpired");
      };
      
      /**
       * Save profile data to local storage
       * */
       authService.saveProfileData = function(profileData) {
        var _deferred = $q.defer();
        var savedProfileData = DataProvider.resource.Preference.get('_loginCred');
        if (!angular.isDefined(profileData.username)) {
          profileData.username = savedProfileData.value
        }
        if (!angular.isDefined(profileData.password)) {
          profileData.password = savedProfileData.password
        }
        if (!angular.isDefined(profileData.autoLogin)) {
          profileData.autoLogin = savedProfileData.autoLogin
        }
        DataProvider.resource.Preference.create({
          id: "_loginCred",
          name: "username",
          value_type: 'string',
          value: profileData.username,
          password: "",//profileData.password,
          autoLogin: profileData.autoLogin
        }).then(function onProfileSaveSuccess(result) {
          _deferred.resolve(result);
        }, function onProfileSaveError(error) {
          _deferred.reject(result);
          console.log(error);
        });
        return _deferred.promise;
      }


      return authService;

    }]);

})();
