/**
 * Created by sudhir on 7/7/15.
 */

;
(function () {
  'use strict';

  /**
   * @ngdoc directive
   * @name infomofo.angularMdPullToRefresh.directive:imPullToRefresh
   * @description
   * # pullToRefresh
   */
  angular.module('app.ptr', [])
    .directive('wwPtr', [
      '$q', '$timeout',
      function ($q, $timeout) {
        var scrollWatcherConfig = {
            velocity: 0.01,
            threshold: 1,
            direction: Hammer.DIRECTION_DOWN
          }
          , pullToRefreshConfig = {
            resistance: 0.4,
            threshold: 58
          },
          enableScrollClass="wptr-enable-pan"
          ;
        var wptr_loaderEl = $('#wptr-loader');

        return {
          restrict: 'A',
          //transclude: true,
          //template: '<md-progress-linear md-mode="indeterminate" class="md-accent ng-hide im-pull-to-refresh-progress-bar" ng-show="pullToRefreshActive"></md-progress-linear><ng-transclude></ng-transclude>',
          scope: {
            refreshFunction: '&wwPtr' // This function is expected to return a future
          },
          link: function postLink(scope, element, attrs) {
            //scope.refreshFunction = scope.$eval(attrs.wwPtr);
            scope.hasCallback = angular.isDefined(attrs.wwPtr);
            scope.isAtTop = false;
            scope.pullToRefreshActive = false;
            scope.lastScrollTop = 0;

            scope.pan = {
              pull_confirmed: false,
              enabled: false
            };

            scope.pullToRefresh = function () {
              if (scope.hasCallback) {
                if (!scope.pullToRefreshActive) {
                  scope.pullToRefreshActive = true;
                  var res = scope.refreshFunction();
                  return $q.when(res)
                    .then(function() {})
                    .catch(function() {})
                    .finally(function() {
                      scope.pullToRefreshActive = false;
                    });
                }
              }

            };

            initialize();



            function initialize() {

              if(mobos.Platform.isIOS()) {
                //var hammerCtrl = new Hammer(document.body);
                //scope.hammerCtrl = hammerCtrl;
                //scope.hammerCtrl.get('pan').set(scrollWatcherConfig);
                ////element.addClass(enableScrollClass);
                //scope.pan.scrollingElement = element[0].parentNode;
              } else {
                var hammerCtrl = new Hammer(element[0]);
                scope.hammerCtrl = hammerCtrl;
                scope.hammerCtrl.get('pan').set(scrollWatcherConfig);
                //element.addClass(enableScrollClass);
                scope.pan.scrollingElement = document;
                scope.pan.scrollingElement.addEventListener('scroll', onScroll);
              }

            }

            function onScroll(ev) {
              //console.log(ev);
              if(isScrollTop()) {
                attachPanListeners();
              } else {
                detachPanListeners();
              }
            }

            function isScrollTop() {
              if(mobos.Platform.isIOS()) {
                return scope.pan.scrollingElement.scrollTop == 0;
              } else if(mobos.Platform.isAndroid()) {
                return document.body.scrollTop == 0;
              } else {
                return false;
              }
            }

            function attachPanListeners() {
              "use strict";
              if(scope.pan.listenersAttached) {
                return;
              }
              //if(mobos.Platform.isIOS()) {
              //  return;
              //}

              console.log('attaching pan listeners..');
              scope.hammerCtrl.on('panstart', onPullStart);
              scope.hammerCtrl.on('pandown', onPullDown);
              scope.hammerCtrl.on('panup', onPullUp);
              scope.hammerCtrl.on('panend', onPullEnd);

              //element.addClass(enableScrollClass);

              scope.pan.listenersAttached = true;
            }
            function detachPanListeners() {
              "use strict";
              if(!scope.pan.listenersAttached) return;
              scope.hammerCtrl.off('panstart', onPullStart);
              scope.hammerCtrl.off('pandown', onPullDown);
              scope.hammerCtrl.off('panup', onPullUp);
              scope.hammerCtrl.off('panend', onPullEnd);
              //element.removeClass(enableScrollClass);

              scope.pan.listenersAttached = false;
            }

            function onPullDown(ev) {
              if(scope.pullToRefreshActive) return;
              if(scope.pan.enabled) {
                ev.preventDefault();
              } else {
                return;
              }
              if (scope.pan.pull_confirmed) {
                wptr_loaderEl.css({
                  '-webkit-transform': 'translateY(' + pullToRefreshConfig.threshold + 'px)'
                });
                return;
              }
              scope.pan.distance = ev.distance * pullToRefreshConfig.resistance;
              if (scope.pan.distance < pullToRefreshConfig.threshold) {
                wptr_loaderEl.css({
                  '-webkit-transform': 'translateY(' + scope.pan.distance + 'px)'
                });
              } else {
                scope.pan.pull_confirmed = true;
                wptr_loaderEl.css({
                  '-webkit-transform': 'translateY(' + pullToRefreshConfig.threshold + 'px)'
                });
                onPullThresholdConfirmed(ev)
              }
            }

            function onPullUp(ev) {
              //console.log(ev);
              if(scope.pan.enabled) {
                ev.preventDefault();
              }


              if (!scope.pan.pull_confirmed) {
                scope.pan.distance = ev.distance * pullToRefreshConfig.resistance;
                wptr_loaderEl.css({
                  '-webkit-transform': 'translateY(' + scope.pan.distance + 'px)'
                });
              } else {

              }
            }

            function onPullStart(ev) {
              if(scope.pullToRefreshActive) return;
              if(document.body.scrollTop == 0) {
                scope.pan.enabled = true;
              } else {
                scope.pan.enabled = false;
              }
              scope.pan.pull_confirmed = false;
              wptr_loaderEl.css({
                '-webkit-transform': 'translateY(0px)'
              });
            }

            function onPullEnd(ev) {
              if(scope.pullToRefreshActive) return;
              if(scope.pan.pull_confirmed) {
                wptr_loaderEl.css({
                  '-webkit-transform': 'translateY(' + pullToRefreshConfig.threshold + 'px)'
                });
                scope.pan.pull_confirmed = false;
              } else {
                wptr_loaderEl.css({
                  '-webkit-transform': 'translateY(0px)'
                });
              }
            }

            function onPullThresholdConfirmed(ev) {
              scope.pullToRefresh()
                .then(function(res) {
                  wptr_loaderEl.css({
                    '-webkit-transform': 'translateY(0px)'
                  });
                });
            }

          }
        };
      }]);

})();