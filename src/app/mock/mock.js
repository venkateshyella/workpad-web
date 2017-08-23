;
(function () {
  "use strict";

  angular.module('app')
    .config(AppRouterConfig);

  function AppRouterConfig($stateProvider, $urlRouterProvider) {

    var mockTemplateRoot = "app/mock";
    
    $stateProvider

      .state('root.app.toolbars', {
        url: 'home',
        templateUrl: mockTemplateRoot+'/home/home.view.html',
        controller: 'HomeViewController',
        resolve: {
        }
      })

      .state('root.app.statestack', {
        url: 'stateStack:name',
        templateUrl: mockTemplateRoot+'/stateStack/stateStack.view.html',
        controller: 'StateNavigationViewController',
        resolve: {
        }
      })

      .state('root.app.forms', {
        url: 'forms',
        templateUrl: mockTemplateRoot+'/forms/formList.view.html',
        controller: 'FormsViewController',
        resolve: {
        }
      })

      .state('root.app.cards', {
        url: 'cards',
        templateUrl: mockTemplateRoot+'/cards/cards.view.html',
        resolve: {
        }
      })

      .state('root.app.dialogs', {
        url: 'dialog',
        templateUrl: mockTemplateRoot+'/dialog/dialogTestbench.view.html',
        controller: 'DialogsViewController',
        resolve: {
        }
      })

      .state('root.app.tabs', {
        url: 'tabs',
        templateUrl: mockTemplateRoot+'/tabs/tabs-material.view.html',
        controller: 'TabsViewController',
        resolve: {
        }
      })

      .state('root.app.list', {
        url: 'tabs',
        templateUrl: mockTemplateRoot+'/list/list.view.html',
        resolve: {
        }
      })

      .state('root.app.demo', {
        url: 'demo/:view',
        templateUrl: function($stateParams) {
          return mockTemplateRoot+'/templates/'+$stateParams.view+'.view.html';
        },
        resolve: {
        }
      });

    //$urlRouterProvider.otherwise(function($injector, $location) {
    //  $location.url('/app/not-found');
    //
    //});
  }

  AppRouterConfig.$inject = ['$stateProvider', '$urlRouterProvider'];

})();
