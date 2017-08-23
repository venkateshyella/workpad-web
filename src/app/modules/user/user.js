// UserModule.js

;
(function () {

  var User = angular.module("User", [
    'Auth'
  ]);

  User.config([
    '$stateProvider', '$urlRouterProvider',
    '$controllerProvider', '$compileProvider', '$filterProvider', '$provide',
    function ($stateProvider, $urlRouterProvider,
              $controllerProvider, $compileProvider, $filterProvider, $provide) {

      User.controllerProvider = $controllerProvider;
      User.compileProvider = $compileProvider;
      User.filterProvider = $filterProvider;
      User.provide = $provide;


    }
  ])

  User.service("UserService", [
    "$rootScope", "$q", "$timeout",
    "Session", "AuthService", "Connect",
    "DataProvider",
    "URL",
    function ($rootScope, $q, $timeout,
              Session, AuthService, Connect,
              DataProvider,
              URL) {
      var _processes = {
        logout: {},
        fetchProfile: {},
        updateProfile: {}
      }

      var _status = {
        loaded: false,
        updated: false
      };
      var __profile_data;
      var __localProfileData;

      function _init() {
        __profile_data = {};
        __localProfileData = {};
      }


      function _logout(defer) {
        var _deferred = defer || $q.defer();
        if (_processes.logout.defer) {
          // Logout in progress..
          // notify caller.
          $timeout(function () {
            _deferred.notify();
          }, 10)
          return _deferred.promise;
        }
        _processes.logout.defer = _deferred;
        $timeout(function () {
          AuthService.logout(Session.userId).then(
            function onLogoutSuccess() {
              if (defer) {
                Session.destroy();
                delete(_processes.logout.defer);
                _deferred.notify();
              } else {
                Session.destroy();
                delete(_processes.logout.defer);
                _deferred.resolve();
              }
            }, function onLogoutError() {
              if (defer) {
                Session.destroy();
                delete(_processes.logout.defer);
                _deferred.notify();
              } else {
                Session.destroy();
                delete(_processes.logout.defer);
                _deferred.reject();
              }
            })
        }, 10);
        return _deferred.promise;
      }

      /**
       * Load Profile data from local storage
       * */
      function loadProfileData() {
        var _deferred = $q.defer();
        DataProvider.resource.Preference.find('_loginCred')
          .then(function onProfileDataLoadSuccess(res) {
            __profile_data.username;
            _deferred.resolve(res);
          }, function onProfileDataLoadError(error) {
            _deferred.resolve({});
          });
        return _deferred.promise;
      }

      /**
       * Save profile data to local storage
       * */
      function _saveProfileData(profileData) {
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

      
      /**
       * Update profile data to local storage
       * */
      function _updateProfileData(profileData) {
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
        
        var LS_loginCred =  {
	          id: "_loginCred",
	          name: "username",
	          value_type: 'string',
	          value: profileData.username,
	          password: "",//profileData.password,
	          autoLogin: profileData.autoLogin
	        };
        
        window.localStorage.setItem('Preference/_loginCred', JSON.stringify(LS_loginCred));
        
        _deferred.resolve();
        
        return _deferred.promise;
      }
      
      function _udpateProfileImages() {
        __profile_data._img_full =
          URL.GET_PIC
          + "?userSessionId=" + Session.id
          + "&entityId=" + __profile_data.id
            // +"&userId="+__profile_data.userId
          + "&imgEntityType=" + "USER"
          + "&imgType=" + "FULL"
        // +"&email="+Session.userId

        __profile_data._img_icon =
          URL.GET_PIC
          + "?userSessionId=" + Session.id
          + "&entityId=" + __profile_data.id
            // +"&userId="+__profile_data.userId
          + "&imgEntityType=" + "USER"
          + "&imgType=" + "ICON"
        // +"&email="+Session.userId
      }

      function _fetchProfile(defer) {
        var _defer = defer || $q.defer();
        if (_processes.fetchProfile.defer) {

          // Chain promise object
          _defer.promise = _processes.fetchProfile.defer.promise.then(function (resolvedResult) {
            return resolvedResult;
          })

        }
        _processes.fetchProfile.defer = _defer;
        $timeout(function () {
          /*Connect.get(URL.GET_PROFILE, {
            id: Session.userId,
            userSessionId: Session.id
          })*/
          DataProvider.resource.User.find(Session.userId)
            .then(function onUpdateSuccess(result) {
            _processes.fetchProfile.defer = null;
            __profile_data = angular.copy(result.resp);
            _status.updated = true;
            _status.updateError = false;
            _udpateProfileImages();

            _defer.resolve(result);
          }, function onUpdateFail(error) {
            _processes.fetchProfile.defer = null;
            _status.updateError = true;
            console.log(error);
            _defer.reject(error);
          })

        }, 1000);
        return _defer.promise;
      }

      function _updateProfile(profileData) {
        __profile_data = angular.copy(profileData);
      }

      function _postProfileData() {
        var _deferred = $q.defer();
        if (_processes.updateProfile.defer) {
          // Logout in progress..
          // notify caller.
          $timeout(function () {
            _deferred.notify();
          }, 10)
          return _deferred.promise;
        }
        _processes.updateProfile.defer = _deferred;
        $timeout(function () {
          var _postData = angular.extend(__profile_data, {
            userEmail: Session.userId,
            userSessionId: Session.id
          });
          delete(_postData._img_icon);
          delete(_postData._img_full);
          Connect.post(URL.UPDATE_PROFILE, _postData).then(function onUpdateSuccess() {
            _processes.updateProfile.defer = null;
            _deferred.resolve();
          }, function onUpdateFail(error) {
            _processes.updateProfile.defer = null;
            console.log(error);
            _deferred.reject(error);
          })

        }, 1000);
        return _deferred.promise;
      }

      function _getProfile() {
        if (_status.updated) {
          return __profile_data;
        } else {
          return null;
        }
      }

      
      /**
       * Load Authentication response data from local storage
       * */
      function _loadAuthResponseData() {
        var _deferred = $q.defer();
        DataProvider.resource.Preference.find('_userAuthResponse')
          .then(function onAuthResponseDataLoadSuccess(res) {
            _deferred.resolve(res);
          }, function onAuthResponseDataLoadError(error) {
            _deferred.resolve({});
          });
        return _deferred.promise;
      }
      
      _init();

      return {
        logout: _logout,
        fetchProfile: _fetchProfile,
        updateProfile: _updateProfile,
        udpateProfileImages: _udpateProfileImages,
        loadProfileData: loadProfileData,
        saveProfileData: _saveProfileData,
        postProfileData: _postProfileData,
        updateProfileData: _updateProfileData,
        profile: _getProfile,
        loadAuthResponseData : _loadAuthResponseData
      }
    }
  ]);

})();
