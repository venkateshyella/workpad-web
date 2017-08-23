;
(function () {
	"use strict";

	angular.module('app')
		.config(AppRouterConfig);

	function AppRouterConfig($stateProvider, $urlRouterProvider) {

		$stateProvider

			.state('root', {
				url: '/',
        abstract: true,
				views: {
					root: {
						template: '<div ui-view class="rootContainer" ng-show="isBootProcessCompleted"></div><div block-ui="appProgressBlocker" class=""></div>',
						controller: 'RootController'
					}
				}
			})

			//.state('boot', {
			//	views: {
			//		root: {
			//			templateUrl: 'app/boot/boot.view.html',
       //     controller: 'BootController'
			//		}
			//	}
			//})

			.state('root.app', {
				url: 'app/',
				abstract: true,
				views : {
					'' : {
					templateUrl: 'app/app.html',
					controller: 'AppMasterController'
					},
					
					'leftSection@root.app' : {
						 templateUrl:'app/modules/app-partials/appLeft.view.partial.html',
						 controller: 'SideMenuController'
					},
				
					'rightSection@root.app' : {
					 templateUrl:'app/modules/app-partials/appRight.view.partial.html',
					 controller: 'AppRightViewController'
					}
				
        },
				resolve: {
					bootResolve: ['BootService', '$state', function (BootService, $state) {
						return BootService.isAppReadyResolve();
					}]
				}
			})

      .state('root.app.notFound', {
        url: 'not-found',
        templateUrl: 'app/default/404.html',
        resolve: {
        }
      })
      .state('root.sessionexpired', {
        url: 'sessionexpired',
        templateUrl: 'app/default/sessionExpired.html',
        resolve: {
        }
      })
    ;

    //$urlRouterProvider.otherwise(function($injector, $location) {
    //  $location.url('/app/not-found');
		//
    //});
	}

	AppRouterConfig.$inject = ['$stateProvider', '$urlRouterProvider'];

})();
