/**
 * Created by rihdus on 22/4/15.
 */

;(function() {

  angular.module('app.core', ['ui.router',
    'app.services', 'app.constants', 'app.base-controllers',
    'Auth'])
    .config(CoreRouterConfig)
    .config(AppConfig)
    
    /**
     * enable below method to 
     * handle auto login fo session expiry
     */
    //.run(SaveCredentialsToLS)
  ;

  function CoreRouterConfig($stateProvider, $urlRouterProvider) {

    $stateProvider

      .state('boot', {
        views: {
          root: {
            templateUrl: 'app/modules/app-core/boot/boot.view.html',
            controller: 'BootViewController'
          }
        }
      })
  }
  CoreRouterConfig.$inject = ['$stateProvider', '$urlRouterProvider'];

  function AppConfig(URLProvider) {
    "use strict";
    URLProvider.setBaseUrl()
  }
  AppConfig.$inject = ['URLProvider'];
  
  function SaveCredentialsToLS($rootScope,SESSION_PSWD){
	  window.onbeforeunload = function () {
		  localStorage.setItem(SESSION_PSWD, JSON.stringify($rootScope.sessionCred));
	  };
  }
  SaveCredentialsToLS.$inject = ["$rootScope","SESSION_PSWD"];

})();
