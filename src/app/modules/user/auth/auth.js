// Auth.js

;(function() {

var Auth = angular.module("Auth", [
	"app", "DL"
]);

Auth.constant('AUTH_EVENTS', {
	loginSuccess 		  : 'auth-login-success',
	loginFailed 		  : 'auth-login-failed',
	loginInProgress 	: 'auth-login-in-progress',
	logoutSuccess 		: 'auth-logout-success',
	logoutFailed 		  : 'auth-logout-fail',
	sessionTimeout 	  : 'auth-session-timeout',
	notAuthenticated 	: 'auth-not-authenticated',
	notAuthorized 		: 'auth-not-authorized'
});

Auth.constant('SESSION_STATUS', {
	NA: "na",
	INVALID: "in",
	EXPIRED: "ex",
	VALID: "va"
});

Auth.service('Session', [
  "$q", "$timeout", '$rootScope',
  "SESSION_STATUS",
function Session ($q, $timeout, $rootScope, SESSION_STATUS) {

	this.create = function (sessionId, userId, userRole, userInfo) {
    if(angular.isDefined(sessionId)
      && angular.isDefined(userId)) {
      this.id = sessionId;
      this.userId = userId;
      this.userInfo = angular.copy(userInfo);
      this.userRole = userRole;

      $rootScope.$broadcast('SESSION_CREATE', this);

    }
    return this;
	};

  this.destroy = function () {
		this.id = null;
		this.userId = null;
		this.userRole = null;
	};

	this.STATUS = SESSION_STATUS.NA;

	this.isValid = function () {
		if(this.id == null
			|| this.id == undefined) {
			return false;
		} else {
			return true;
		}
	};

	function _init() {
		this.id = null;
		this.userId = null;
		this.userRole = null;
	}

	function _getSession() {
		var defer = $q.defer();
		if(typeof(this.id)=='undefined' || this.id==null) {
			$timeout(function() {
				defer.notify(SESSION_STATUS.NA);
			}, 100);
		} else {
			defer.resolve();
		}
		return defer.promise;
		// return this.id;
	}

	this.getSession = _getSession;

	// Constructor
	_init();
	return this;
}]);

Auth.config([
	'$stateProvider', '$urlRouterProvider',
	'$controllerProvider', '$compileProvider', '$filterProvider', '$provide',
	'APP_ROUTES',
	function(
		$stateProvider, $urlRouterProvider,
		$controllerProvider, $compileProvider, $filterProvider, $provide,
		APP_ROUTES)
	{

		Auth.controllerProvider = $controllerProvider;
		Auth.compileProvider    = $compileProvider;
		Auth.filterProvider     = $filterProvider;
		Auth.provide            = $provide;

		$stateProvider

		.state(APP_ROUTES.AUTH_STATE.name, {
			url: APP_ROUTES.AUTH_STATE.url,
			views: {
				auth_view: {
					templateUrl: function($stateParams) {
						return "js/module/Auth/"+$stateParams.state+".tpl.html"
					},
					controllerProvider: function ($stateParams) {
						return "Auth."+$stateParams.state+".Controller";
					},
					resolve: {
						load: [
							"$rootScope",
							"$stateParams", "$q", "$timeout",  function (
								$rootScope,
								$stateParams, $q, $timeout) {
							// console.log('resolving');
							var _deferred = $q.defer();
							_auth_route_resolve($stateParams.state)
							.then(function onRouteResolveSuccess() {
								_deferred.resolve();
							}, function onRouteResolveError (error) {
								_deferred.reject();
							})

							return _deferred.promise;

							function _auth_route_resolve(name) {
								// console.log("resolving auth route");
								var deferred = $q.defer();
								$script ([
									'js/module/Auth/'+name+'.controller.js'
								], function () {

									$timeout(function() {
										$rootScope.$apply(function () {
											deferred.resolve();
										});
									})

								});
								return deferred.promise;
							}

						}]
					}
				}
			}
		})
		;
	}
])

})();
