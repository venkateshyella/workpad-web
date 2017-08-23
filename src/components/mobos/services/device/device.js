;(function() {

  /**
   * @ngdoc service
   * @name DeviceServices
   * @module DeviceServices
   * @description
   *
   */
  angular.module('DeviceServices', [])
    .provider('$device', DeviceServices);

  function DeviceServices() {
    return {
      $get: ['$q', '$rootScope', function($q, $rootScope) {
        var self = {
          PLATFORM_BACK_BUTTON_PRIORITY_NAVIGATION: 100,
          PLATFORM_BACK_BUTTON_PRIORITY_SIDE_MENU: 150,
          PLATFORM_BACK_BUTTON_PRIORITY_MODAL: 200,
          PLATFORM_BACK_BUTTON_PRIORITY_ACTION_SHEET: 300,
          PLATFORM_BACK_BUTTON_PRIORITY_POPUP: 400,
          PLATFORM_BACK_BUTTON_PRIORITY_LOADING: 500,

          /**
           * @ngdoc method
           * @name $device#onHardwareBackButton
           * @description
           * Some platforms have a hardware back button, so this is one way to
           * bind to it.
           * @param {function} callback the callback to trigger when this event occurs
           */
          onHardwareBackButton: function(cb) {
            mobos.Platform.ready(function() {
              document.addEventListener('backbutton', cb, false);
            });
          },

          /**
           * @ngdoc method
           * @name $device#offHardwareBackButton
           * @description
           * Remove an event listener for the backbutton.
           * @param {function} callback The listener function that was
           * originally bound.
           */
          offHardwareBackButton: function(fn) {
            mobos.Platform.ready(function() {
              document.removeEventListener('backbutton', fn);
            });
          },

          /**
           * @ngdoc method
           * @name $device#registerBackButtonAction
           * @description
           * Register a hardware back button action. Only one action will execute
           * when the back button is clicked, so this method decides which of
           * the registered back button actions has the highest priority.
           *
           * For example, if an actionsheet is showing, the back button should
           * close the actionsheet, but it should not also go back a page view
           * or close a modal which may be open.
           *
           * The priorities for the existing back button hooks are as follows:
           *   Return to previous view = 100
           *   Close side menu = 150
           *   Dismiss modal = 200
           *   Close action sheet = 300
           *   Dismiss popup = 400
           *   Dismiss loading overlay = 500
           *
           * Your back button action will override each of the above actions
           * whose priority is less than the priority you provide. For example,
           * an action assigned a priority of 101 will override the 'return to
           * previous view' action, but not any of the other actions.
           *
           * @param {function} callback Called when the back button is pressed,
           * if this listener is the highest priority.
           * @param {number} priority Only the highest priority will execute.
           * @param {*=} actionId The id to assign this action. Default: a
           * random unique id.
           * @returns {function} A function that, when called, will deregister
           * this backButtonAction.
           */
          $backButtonActions: {},
          registerBackButtonAction: function(fn, priority, actionId) {
            if (!self._hasBackButtonHandler) {
              // add a back button listener if one hasn't been setup yet
              self.$backButtonActions = {};
              self.onHardwareBackButton(self.hardwareBackButtonClick);
              self._hasBackButtonHandler = true;
            }

            var action = {
              id: (actionId ? actionId : mobos.Utils.nextUid()),
              priority: (priority ? priority : 0),
              fn: fn
            };
            self.$backButtonActions[action.id] = action;

            // return a function to de-register this back button action
            return function() {
              delete self.$backButtonActions[action.id];
            };
          },

          /**
           * @private
           */
          hardwareBackButtonClick: function(e) {
            // loop through all the registered back button actions
            // and only run the last one of the highest priority

            console.log("hardwareBackButtonClick");
            var priorityAction, actionId;
            for (actionId in self.$backButtonActions) {
              if (!priorityAction || self.$backButtonActions[actionId].priority >= priorityAction.priority) {
                priorityAction = self.$backButtonActions[actionId];
              }
            }
            if (priorityAction) {
              priorityAction.fn(e);
              return priorityAction;
            }
          },

          is: function(type) {
            return mobos.Platform.is(type);
          },

          /**
           * @ngdoc method
           * @name $device#on
           * @description
           * Add Cordova event listeners, such as `pause`, `resume`, `volumedownbutton`, `batterylow`,
           * `offline`, etc. More information about available event types can be found in
           * [Cordova's event documentation](https://cordova.apache.org/docs/en/edge/cordova_events_events.md.html#Events).
           * @param {string} type Cordova [event type](https://cordova.apache.org/docs/en/edge/cordova_events_events.md.html#Events).
           * @param {function} callback Called when the Cordova event is fired.
           * @returns {function} Returns a deregistration function to remove the event listener.
           */
          on: function(type, cb) {
            mobos.Platform.ready(function() {
              document.addEventListener(type, cb, false);
            });
            return function() {
              mobos.Platform.ready(function() {
                document.removeEventListener(type, cb);
              });
            };
          },

          /**
           * @ngdoc method
           * @name $device#ready
           * @description
           * Trigger a callback once the device is ready,
           * or immediately if the device is already ready.
           * @param {function=} callback The function to call.
           * @returns {promise} A promise which is resolved when the device is ready.
           */
          ready: function(cb) {
            var q = $q.defer();

            mobos.Platform.ready(function() {
              q.resolve();
              cb && cb();
            });

            return q.promise;
          }
        };
        return self;
      }]
    };
  }
  DeviceServices.$inject=[]

})();
