/**
 * Created by rihdus on 28/4/15.
 */

;
(function () {
  angular.module('Drawer', ['mobos.core', 'Backdrop'])
    .controller('NavigationDrawerController', NavigationDrawerController)
    .service('DrawerService', DrawerService)
    .directive('drawer', NavigationDrawer);


  function NavigationDrawer($document, $timeout, $animate, $q, backdrop) {

    // TODO(Rihdus) Customize drawer alignment. eg. top, bottom, left and right

    // TODO(Rihdus) Customize drawer size.

    return {
      restrict: 'E',
      scope: {
        parentAlign: '@',
        width: '@',
        height: '@',
        isOpen: '=?isOpen',
        componentId: '@'
      },
      controller: 'NavigationDrawerController',
      link: {
        pre: preLink,
        post: postLink
      }
    };

    function preLink(scope, elem, attrs) {

      renderDrawer();

      function renderDrawer() {
        var drawerCssAttributes = {};
        scope.parentAlign = scope.parentAlign || 'left';
        switch (scope.parentAlign) {
          case 'left':
          default:
            if(scope.width) {
              drawerCssAttributes['width'] = scope.width;
            }
            drawerCssAttributes['left'] = '-'+scope.width;
        }
        elem.css(drawerCssAttributes);
      }

    }
    function postLink(scope, elem, attrs, drawerCtrl) {
      var drawerBackdrop = backdrop.new();

      scope.$watch('isOpen', updateDrawer);

      drawerCtrl.$toggleOpen = toggleOpen;

      function updateDrawer(isOpen) {

        $document.find('body')[isOpen ? 'addClass': 'removeClass']("blockScrolling");

        return promise = $q.all([
          $animate[isOpen ? 'addClass' : 'removeClass'](elem, 'is-open').then(function() {
            drawerBackdrop[isOpen ? 'show': 'remove']();
            drawerBackdrop.element[isOpen ? 'on': 'off']('click', close);
          })
        ]);
      }

      function toggleOpen( isOpen ) {
        if (scope.isOpen == isOpen ) {

          return $q.when(true);

        } else {
          var deferred = $q.defer();

          // Toggle value to force an async `updateIsOpen()` to run
          scope.isOpen = isOpen;

          $timeout(function() {

            // When the current `updateIsOpen()` animation finishes
            promise.then(function(result){

              deferred.resolve(result);
            });

          },0,false);

          return deferred.promise;
        }
      }

      function close(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        return drawerCtrl.close();
      }

    }
  }
  NavigationDrawer.$inject = ['$document', '$timeout', '$animate', '$q', 'backdrop'];

  function NavigationDrawerController($scope, $q, $componentRegistry) {
    var self = this;

    self.$toggleOpen = function() { return $q.when($scope.isOpen); };

    self.isOpen = function() { return !!$scope.isOpen; };
    self.isLockedOpen = function() { return !!$scope.isLockedOpen; };

    self.open   = function() { return self.$toggleOpen( true );  };
    self.close  = function() { return self.$toggleOpen( false ); };
    self.toggle = function() { return self.$toggleOpen( !$scope.isOpen );  };

    self.destroy = $componentRegistry.register(self, $scope.componentId);
  }
  NavigationDrawerController.$inject = ['$scope', '$q', '$componentRegistry'];

  function DrawerService($componentRegistry, $q) {
    function drawerPublicService(handle) {

      var instance = $componentRegistry.get(handle);
      if(!instance) {
        $componentRegistry.notFoundError(handle);
      }

      return {
        isOpen: function() {
          return instance.isOpen();
        },
        toggle: function() {
          return instance ? instance.toggle() : $q.reject(errorMsg);
        },
        open: function() {
          return instance ? instance.open() : $q.reject(errorMsg);
        },
        close: function() {
          return instance ? instance.close() : $q.reject(errorMsg);
        }
      }

    }
    return drawerPublicService;
  }
  DrawerService.$inject=['$componentRegistry', '$q'];
})();
