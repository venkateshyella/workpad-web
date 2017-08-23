
angular.module('app.modules')
  .directive('eventList', [
    '$rootScope', 'Lang',
    function ($rootScope, Lang) {

      var LANG = Lang.data;

      // @formatter:off
      var eventListTemplateString = '<div class="list">' +
          '<div ' +
            'ng-repeat="event in list" ' +
            'class="item">' +
            '<h3 ng-bind="\'\'"></h3>' +
          '</div>' +
          '<div class="item">' +
            '<p ng-show="list.length==0" class="text-center">No Events available</p>' +
          '</div>' +
        '</div>' +
        '';
      // @formatter:on

      return {
        scope: {
          list: '=',
          eventCollection: '=',
          pageLoader: '='
        },
        link: function (scope) {
          "use strict";
          scope.LANG = LANG;
          scope.autoLoad = false;
          scope.listMeta = {};

          scope.fetchPage = function () {
            _fetchPage(scope);
          };

          scope.fetchNextEventPage = function () {
            _fetchPage(scope);
          };

          scope.$on('$destroy', function () {
            scope.pageLoader && scope.pageLoader.resetPagination();
          });

          if (scope.eventCollection && scope.pageLoader) {
            initListLoaders(scope, attrs);
          }
        },
        template: eventListTemplateString
      };

      function _fetchPage(scope) {
        try {
          scope.pageLoader.fn()
            .then(function () {
              scope.list = _.uniq(scope.list.concat(scope.eventCollection),
                function (event) {
                  return event.id;
                });
            })
            .finally(function () {
              $rootScope.toolbarLoader.async_active = false;
            });
          $rootScope.toolbarLoader.async_active = true;
        } catch (e) {
          $rootScope.toolbarLoader.async_active = false;
        }
      }

      function initListLoaders(scope, attrs) {
        "use strict";
        scope.autoLoad = true;
        scope.list = [];
        scope.activityStore = scope.pageLoader.getActivityStore();

        _fetchPage(scope)
      }
    }
  ]);