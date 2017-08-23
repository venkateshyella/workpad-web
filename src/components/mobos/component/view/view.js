;
(function () {

	angular.module("mobos.view", ['mobos.core', 'ngTouch'])
		.directive('view', ViewDirective)
		.directive('viewOptions', ViewOptionsDirective);


	// TODO: Test cases for view directive.
	// TODO: Test Child directive broadcasts.

	function ViewDirective($rootScope, $timeout, $interval, $Constant) {

		function postLink(scope, elem, attrs) {
		}

		function preLink(scope, elem, attrs) {
			//console.info("view preLink");
			this.viewReiszeWatchTimer = null;

			function preLinkSetup(scope, elem, attrs) {
				scope.elem = elem;
				scope.attrs = attrs;
				
				/**
				 * for web browser
				 */
				scope.elem.addClass('job-toolbar');

				computeViewParams(scope, elem, attrs);
				
				elem.attr('title', '');
			}

			preLinkSetup(scope, elem, attrs);

			if (mobos.Platform.isIOS()) {
				resizeView(scope);
			} else if (mobos.Platform.isAndroid()) {
				resizeView(scope);
			}
		}

		function computeViewParams(scope) {
			//scope.height = mobos.Viewport.screen().height;
			scope.viewWidth = mobos.Viewport.screen().width;

			scope.content_bottom = 0;

			switch (scope.attrs.type) {
				case 'fullScreenView':
					scope.content_top = 0;
					break;

				case 'toolbarView':
					scope.content_top = $Constant.COMPONENT.TOOLBAR.HEIGHT;
					break;

				case 'content':
					scope.content_top = 0;
					break;

				default:
					scope.content_top = 0;
			}

			/* iOS statusbar height offset */
			scope.content_top += (mobos.Platform.isIOS() ? $Constant.IOS_STATUS_BAR_HEIGHT : 0 );

			scope.content_height = scope.height - scope.content_top - scope.content_bottom;
		}

		function resizeView(scope) {
			var height_inPx = parseFloat(scope.height) + "px";
			//console.info("View resize:", height_inPx);
			if (mobos.Platform.isIOS()) {
				var $body = $('body');
				$body.css('height', height_inPx);
				$body[0].style.height = height_inPx;
				$('html').css('height', height_inPx);
				scope.elem.css('height', height_inPx);
				scope.elem.find('view-content').css('height', height_inPx);
				//scope.elem.find('.view-content').css('padding-top', parseFloat(scope.content_top) + "rem");
			} else if (mobos.Platform.isAndroid()) {
				if (scope.attrs.type == 'fullScreenView') {
					scope.elem.css('min-height', height_inPx);
					scope.elem.find('view-content').css('min-height', height_inPx);
				} else {
					//scope.elem.find('.view-content').css('padding-top', parseFloat(scope.content_top) + "rem");
				}
			}
		}

		function ViewController($scope, $q, $element) {
			var self = this,
				scrollWatcherConfig = {
					velocity: 0.01,
					threshold: 2,
					direction: Hammer.DIRECTION_DOWN
				}
				;
			self.viewResizeListener_deregister = null;
			this.attrs = $scope.attrs;
			self.toolbars = [];
			self.viewReiszeWatchTimer = null;
			$scope.height = mobos.Viewport.screen().height - $Constant.IOS_STATUS_BAR_HEIGHT;
			$scope.viewToolbarHeight =
				this.viewToolbarHeight =
					$Constant.COMPONENT.TOOLBAR.HEIGHT + (mobos.Platform.isIOS() ? $Constant.IOS_STATUS_BAR_HEIGHT : 0);
			this.height = $scope.height;
			$scope._pendingViewChangeDefer = [];

			self.viewResizeListener_deregister
				= $rootScope.$on('view:resize', function () {
				"use strict";
				/* Resize watcher watching for changes */
				startResizeViewWatcher({retry: 3, interval: 300, forceUpdate: true});
			});

			function initializeScrollListeners() {
				"use strict";
				var hammerEl = new Hammer($element[0]);

				hammerEl.get('pan').set(scrollWatcherConfig);

				hammerEl.on('pandown', function (ev) {
					console.log(ev);
				});
			}

			function destroyScrollListeners() {
			}

			function onScrollToTop() {
			}

			function onScrollToBottom() {
			}

			function startResizeViewWatcher(options) {
				"use strict";
				options = options || {};
				var retryCount = options.retry || 5;
				var retryInterval = options.interval || 200;
				var e = options.keypadEvent;
				if (self.viewReiszeWatchTimer) $interval.cancel(self.viewReiszeWatchTimer);

				self.viewReiszeWatchTimer = $interval(function () {
					var prevHeight = angular.copy(self.height);
					if (mobos.Viewport.isKeyPadUp) {
						var keypadHeight = e && e.detail && e.detail.keyboardHeight;
						if (mobos.Platform.isIOS()) {
							self.height
								= $scope.height
								= (mobos.Viewport.screen().height - keypadHeight);
						} else {
							self.height = $scope.height = mobos.Viewport.screen().height;
						}
					} else {
						self.height = $scope.height = mobos.Viewport.screen().height;
					}
					if (self.height != prevHeight || options.forceUpdate) {
						computeViewParams($scope);
						resizeView($scope);
						notifyViewChangeListeners();
						//console.log('update view');
					}
				}, 200, retryCount, true);
			}

			function registerListeners() {
				mobos.on('mobos.orientationChange', onDeviceOrientationChange, window);
				mobos.on('mobos.keyboardshow', keyboardShowHandler, window);
				mobos.on('mobos.keyboardhide', keyboardHideHandler, window);
			}

			function de_registerListeners() {
				mobos.off('mobos.orientationChange', onDeviceOrientationChange, window);
				mobos.off('mobos.keyboardshow', keyboardShowHandler, window);
				mobos.off('mobos.keyboardhide', keyboardHideHandler, window);
				//window.removeEventListener('native.keyboardshow', keyboardShowHandler);
				//window.removeEventListener('native.keyboardhide', keyboardHideHandler);
			}

			$scope.$on('$destroy', function () {
				destroy();
			});

			// TODO: Test orientation change.
			function onDeviceOrientationChange() {
				//this.height = $scope.height = mobos.Viewport.screen().height;
				//computeViewParams($scope);
				//resizeView($scope);
				//notifyViewChangeListeners();
				startResizeViewWatcher();
			}

			// TODO: Test Keyboard handler.
			function keyboardHideHandler(e) {
				//this.height = $scope.height = mobos.Viewport.screen().height;
				//
				//if (mobos.Platform.isIOS()) {
				//  $timeout(function () {
				//    "use strict";
				//    //mobos.Viewport.unLockOrientation();
				//  }, 400);
				//}
				//
				//computeViewParams($scope);
				//resizeView($scope);
				//notifyViewChangeListeners();
				startResizeViewWatcher({
					keypadEvent: e
				});

			}

			function keyboardShowHandler(e) {
				//if (mobos.Platform.isIOS()) {
				//  this.height = $scope.height = (mobos.Viewport.screen().height - e.detail.keyboardHeight);
				//
				//
				//  if (mobos.Platform.isIOS()) {
				//    $timeout(function() {
				//      "use strict";
				//      //mobos.Viewport.lockOrientation();
				//    }, 400);
				//  }
				//
				//} else if (mobos.Platform.isAndroid()) {
				//  this.height = $scope.height = (mobos.Viewport.screen().height);
				//}
				startResizeViewWatcher({
					keypadEvent: e
				});

			}

			registerListeners();
			//initializeScrollListeners();

			function destroy() {
				"use strict";
				de_registerListeners();
				destroyScrollListeners();
				if (angular.isFunction(self.viewResizeListener_deregister)) {
					self.viewResizeListener_deregister();
				}
			}

			function notifyViewChangeListeners() {
				angular.forEach($scope._pendingViewChangeDefer, function (defer) {
					defer.notify();
				})
			}

			/**
			 * Private interface for additions of toolbars to a view.
			 *
			 * TODO: Add support for multiple toolbars.
			 * ## Toolbars can be shown as a overlay on top of the primary toolbar.
			 *
			 * @param appToolbarCtrl
			 * @param element
			 */
			this.addViewToolbar = function (appToolbarCtrl, element) {
				self.toolbars.push({
					ctrl: appToolbarCtrl,
					el: element
				});
				$($element[0]).children('.view-toolbar').append(element);
			};

			this.params = function () {
				return {
					height: $scope.height,
					content_top: $scope.content_top,
					content_bottom: $scope.content_bottom,
					content_height: $scope.content_height
				}
			};

			this.registerViewChangeListener = function () {
				var deferred = $q.defer();

				$scope._pendingViewChangeDefer.push(deferred);

				return deferred.promise;
			}


		}

		return {
			restrict: "E",
			scope: {
				type: '=',
				screenType: '=',
				title: '=',
				scroller: '@'
			},
			link: {
				post: postLink,
				pre: preLink
			},
			transclude: true,
			template: function (tElement, tAttrs) {

				var FULLSCREEN_VIEW_TEMPLATE = '<view-content class="view-full-screen view-content" ng-transclude></view-content>';
				var TOOLBAR_VIEW_TEMPLATE =
					'<div class="view-toolbar"></div>'+
					'<view-content class="view-content" ng-transclude></view-content>';

				var CONTENT_VIEW_TEMPLATE =
					'<view-content class="view-content" ng-transclude></view-content>';

				var viewType = tAttrs.type || "fullScreenView";

				switch (viewType) {
					case 'fullScreenView':
						return FULLSCREEN_VIEW_TEMPLATE;
						break;

					case 'toolbarView':
						return TOOLBAR_VIEW_TEMPLATE;
						break;

					case 'content':
						return CONTENT_VIEW_TEMPLATE;
						break;

					default:
				}

			},
			controller: ['$scope', '$q', '$element', ViewController]
		}

	}

	ViewDirective.$inject = ['$rootScope', '$timeout', '$interval', '$Constant'];

	function ViewOptionsDirective() {

		return {
			restrict: "E",
			require: "^view",
			link: {
				pre: preLink,
				post: postLInk
			}
		};

		function preLink(scope, elem, attrs, viewCtrl) {
		}

		function postLInk(scope, elem, attrs, viewCtrl) {
		}

	}

	ViewOptionsDirective.$inject = [];


})();
