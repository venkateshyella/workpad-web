// navigation.js

(function () {

  angular.module("Navigator", ['ui.router', 'DeviceServices'])
    .service('State', StateNavigationService);

  function StateNavigationService($q, $timeout, $state, $rootScope, $device) {

    var navstack,
      _navigationInProgress,
      _navigationWaitDefer = null;

    _init();

    return {
      getStack: function () {
        return navstack
      },
      transitionTo: transitionTo,
      resetTransitionTo: resetTransitionTo,
      transitionBack: transitionBack,
      waitForTransitionComplete: waitForTransitionComplete,
      prev: prevState,
      curr: currState
    }

    function _init() {
      navstack = [];
      _navigationWaitDefer = [];
      _navigationInProgress = false;
      watchNavigationBackRouteChanges();

      $device.registerBackButtonAction(function() {
        transitionBack().then(null, function() {
          mobos.trigger('mobos.backbutton.end.of.stack');
        });
      }, $device.PLATFORM_BACK_BUTTON_PRIORITY_NAVIGATION)

    }

    function watchNavigationBackRouteChanges() {
      $rootScope.$on('$viewContentLoaded', function(event, transitionOptions) {
        if(transitionOptions && transitionOptions.location == false) {
          resolveNavigationWaitBucket();
        }
      })
    }

    function resolveNavigationWaitBucket(navObject) {
      angular.forEach(_navigationWaitDefer, function(waitee) {
        waitee.deferred.resolve(navObject);
      });
      _navigationWaitDefer = [];
    }

    function _onTransitionSuccess(navObject) {

      if (_isNavigatingBack()) {
        // Pop navigation stack.
        //var popedNavObject = navstack.pop();
        //console.log('Pop navigation stack.');
        //console.log(popedNavObject)
      } else {
        if (_isNavigatingForward()) {
          // Update navigation stack.

          /* If previous state is exactly same as the current state.
           * Do not push the new navigation object to stack as the history stack does not change. */
          if(!currState() ||
            currState().toState != navObject.toState ||
            !angular.equals(currState().toParams, navObject.toParams))
          {
	          if(navObject.options.FLAGS.REPLACE_STATE) {
		          var replacedState = navstack.pop();
		          navstack.push(navObject);
	          }
	          else {
		          navstack.push(navObject);
	          }
          } else {

          }
          //console.log(navstack);

          /**
           * -----------------
           * FLAGS.CLEAR_STACK
           * -----------------
           * Clear all previous navigation objects.
           */
          if(navObject.options.FLAGS.CLEAR_STACK) {
            while(navstack.length!=1) {
              navstack.shift();
            }
            //console.log('clearing stack');
            //console.log(navstack);
          }

          resolveNavigationWaitBucket(navObject);
        }
      }


      /**
       * Push new navigation object into the nav stack.
       */
      if (navObject.options.collapseNavStackToCurrentState) {
        var currentState = angular.copy(currState());
        delete(navstack);
        navstack = [];
        navstack.push(currentState);
      }


      /**
       * Back navigation detection.
       *
       * Back navigation detected from the options argument
       * 'transitionForward'.
       */
      function _isNavigatingBack() {
        "use strict";
        return navObject.options.transitionForward == false;
      }

      /**
       * Forward navigation detection.
       */
      function _isNavigatingForward() {
        "use strict";
        return navObject.options.transitionForward == true;
      }
    }

    /**
     * transitionTo:  Wrapper around ui-router 'transitionTo' method.
     *                Navigates to the given state.
     *                Returns a promise which is resolved if and after transition is successful,
     *                rejected is transition fails.
     *
     * @param  {string} routeName   Transition route name
     * @param  {Object} routeParams route parameters
     * @param  {Object} options     Optional parameters as described in ui-router 'transitionTo' function.
     * @return {Object}             Angular promise object
     */
    function transitionTo(routeName, routeParams, options) {
      var _deferred = $q.defer()
        , options = options || {};
      options.FLAGS = options.FLAGS || {};

      var navObject = {
        toState: routeName,
        toParams: routeParams,
        fromState: $state.current,
        fromParams: $state.params,
        options: options
      };

      options.transitionForward = options.transitionForward || true;
      var transitionRequest = {
        routeName: routeName,
        routeParams: routeParams,
        options: options
      };
      _navigationInProgress = true;

      function onStateTransitionSuccess(result) {
        _navigationInProgress = false;

        _onTransitionSuccess(navObject);

        _deferred.resolve(result);
      }

      function onStateTransitionError(error) {
        _navigationInProgress = false;
        _deferred.reject(error);
      }

      function onStateTransitionNotification(noti) {
        _deferred.notify(noti);
      }

      $state.transitionTo(routeName, routeParams, options)
        .then(onStateTransitionSuccess,
        onStateTransitionError,
        onStateTransitionNotification);
      return _deferred.promise;
    }

    /**
     * Transition to given route and collapse the navigation stack to current stack.
     * @param {string} routeName    Next route name.
     * @param {Object} routeParams  route parameters.
     * @param {Object} options      Optional arguments.
     * @return {Object}             Angular promise object.
     */
    function resetTransitionTo(routeName, routeParams, options) {
      "use strict";
      options = options || {};
      options.collapseNavStackToCurrentState = true;
      transitionTo(routeName, routeParams, options);
    }

    /**
     * Navigate Back to the previous state. Returns a angular promise object.
     * The promise is resolved immediately.
     * @return {Object}           Angular promise object
     */
    function transitionBack() {
      var _deferred = $q.defer();
      var prevStateObj = prevState();
      if (prevStateObj) {
        var navObject = navstack.pop();
        transitionTo(prevStateObj.toState, prevStateObj.toParams, prevStateObj.options);
      
        //console.log('Pop navigation stack.');
        //console.log(navObject)
        _deferred.resolve();
      } else {
        _deferred.reject();
      }
      //console.log(navstack);
      return _deferred.promise;
    }

    /**
     * prevState: Return the previous state object in the navigation stack.
     *  If no previous state available, return null.
     * @return {Object, null} Previous state object or null.
     */
    function prevState() {
      if (navstack.length > 1) {
        var prevState = navstack[navstack.length - 2];
        return prevState
      } else {
        return null;
      }
    }

    /**
     * currState: return the current state object
     * @return {Object} Curent state object
     */
    function currState() {
      if (navstack.length > 0) {
        return navstack[navstack.length - 1];
      } else {
        return null;
      }
    }

    function waitForTransitionComplete() {
      var deferred = $q.defer();
      _navigationWaitDefer.push({
        deferred: deferred
      });
      return deferred.promise;
    }
  }

  StateNavigationService.$inject = ['$q', '$timeout', '$state', '$rootScope', '$device'];

})();
