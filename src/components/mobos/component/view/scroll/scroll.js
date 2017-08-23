/**
 * Created by rihdus on 19/4/15.
 */

;
(function () {

	angular.module("mobos.view")
		.directive('scroll', ScrollerDirective);

	function ScrollerDirective($timeout) {
		var scroller, scrollClickWatcher;

		var TEXT_FIELD_REGEX = /^(textarea|text|email|number|password|search|tel|url|datetime)$/;

		function isTextField(node) {
			if (node.type && TEXT_FIELD_REGEX.test(node.type.toLowerCase())) {
				return true;
			} else {
				return false;
			}
		}

		/**
		 * Match HTML length units: px, em, rem
		 * Match "fill_remaining"
		 * @type {RegExp}
		 */
		var REGEX_LAYOUT_HEIGHT = /^(\d+(px|em|rem)|(fill_remaining))$/;
		var REGEX_HTML_LENGTH = /^(\d+(px|em|rem))$/;

		function postLink(scope, elem, attrs, rowCtrl) {
			scope.layoutAttributes = rowCtrl.layoutAttributes();
			scope.$on('$destroy', function () {
				scope.destroyScroller(elem);
			});

			var scrollViewHeight = rowCtrl.rowScope.layoutHeight;
			if (REGEX_LAYOUT_HEIGHT.test(scrollViewHeight)) {
				switch (scrollViewHeight) {
					case "fill_remaining":
						break;
					default:
						if (REGEX_HTML_LENGTH.test(scrollViewHeight)) {
							scope.scrollViewHeight = scrollViewHeight;
						}
				}
			} else {
				console.error("invalid layout_height value.");
			}

			//console.info("scroll postLink");
			updateScrollingElementHeight(elem, scope.scrollViewHeight);
			if (mobos.Platform.isIOS()) {
			} else {
			}
			drawView(scope, elem);
			rowCtrl.registerViewChangeListener().then(function () {
				},
				function () {
				},
				function onRowUpdateNotification() {
					drawView(scope, elem);
				});
		}

		function preLink(scope, elem, attrs, rowCtrl) {
		}

		function updateScrollingElementHeight(elem, newScrollViewHeight) {
			//elem.attr('style', "height:"+(newScrollViewHeight)+";");
			elem.css('height', parseFloat(newScrollViewHeight) + "px");
		}

		function drawView(scope, viewRootEl) {
			//console.info("drawing scroller");
			if (mobos.Platform.isIOS()) {
				scope.initializeIosScroller(scope, viewRootEl);
			} else if (mobos.Platform.isAndroid()) {
				scope.initializeAndroidScroller(scope, viewRootEl);
			}
		}

		function ScrollController(scope, $element, $timeout) {

			var self = this;

			scope.initializeAndroidScroller = initializeAndroidScroller;
			scope.initializeIosScroller = initializeIosScroller;
			scope.destroyScroller = destroyScroller;

			function destroyScroller() {
				$element.off('click', inputElementWatcher);
			}

			function initializeAndroidScroller(scope) {
				updateScrollingElementHeight($element, scope.scrollViewHeight);
				var scrollRowAttributes = {};
				if (scope.layoutAttributes && scope.layoutAttributes.positioning == 'absolute') {
					scrollRowAttributes.position = 'absolute';
				} else {
					scrollRowAttributes.position = 'initial';
				}
				$element.css(scrollRowAttributes);
			}

			function initializeIosScroller(scope) {
				var scrollerHeight = scope.scrollViewHeight;
				self.scrollContainerEl = angular.element($($element[0]).children('.scroll-container')[0]);
				initializeScrollElemClickWatcher();

				mobos.on('mobos.keyboardshow', keyboardShowHandler);

				if (mobos.Platform.isWebView()) {
					if (cordova && cordova.plugins && cordova.plugins.Keyboard) {
						cordova.plugins.Keyboard.disableScroll(true);
					}
					mobos.requestAnimationFrame(function () {
						"use strict";
						$element.css({
							'position': 'absolute',
							'overflow': 'scroll',
							'-webkit-overflow-scrolling': 'touch',
							'overflow-x': 'hidden'
						});
					});
				}

				$element.css({
					'position': 'absolute'
				});

				//$timeout(function () {
				//  if(!scope.scroller) {
				//    scope.scroller = new IScroll(elem[0], {
				//      mouseWheel: true,
				//      //scrollbars: true,
				//      vScrollbar: false,
				//      useTransition: true,
				//      //click: true,
				//      tap: true
				//    });
				//  } else {
				//    scope.scroller.refresh();
				//  }
				//  if (mobos.Platform.isWebView()) {
				//    if(cordova.plugins && cordova.plugins.Keyboard) {
				//      cordova.plugins.Keyboard.disableScroll(true);
				//    } else {
				//      throw "Cordova keyboard plugin not found. Please install "
				//    }
				//  }
				//}, 100);

				function initializeScrollElemClickWatcher() {
					if (!self.scrollClickWatcher)
						self.scrollClickWatcher = $element.on('click', inputElementWatcher);

					if (self.scrollTouchWatcher)
						self.scrollTouchWatcher = $element.on('touchstart', scrollTouchStartHandler);
				}
			}

			function keyboardShowHandler(e) {
				self.keyboardHeight = e.detail.keyboardHeight;

				/**
				 * Trick iOS scroller to enable overflow scrolling on view resize due to
				 * keyboard show event.
				 *
				 * */
				mobos.requestAnimationFrame(function () {
					"use strict";
					self.scrollContainerEl.css('padding-bottom', '100px');
					$timeout(function () {
						self.scrollContainerEl.css('padding-bottom', '1px');
					}, 500);
				});
				//self.scrollContainerEl.on('touchstart', function(e) {});
				updateScrollPosition();

			}

			function scrollTouchStartHandler(e) {
				// clear input element scroll target is available.
				if (self.scrollToInputEvent)
					delete(self.scrollToInputEvent);
			}

			function inputElementWatcher(e) {
				// do not add any input scroll target if the keyboard is already visible.
				//if(cordova && cordova.plugins.Keyboard && cordova.plugins.Keyboard.isVisible) return;

				// Test click target. Ensure only input and textarea fields are targeted.
				if (isTextField(e.target)) {

					self.scrollToInputEvent = e;

					if (self.keyboardHeight) {
						//updateScrollPosition();
					}

				} else {
				}
			}

			/**
			 * Update the scroll position of the scrolling row element.
			 *
			 * Computes the delta-y offset between the clicked position and the keyboard height.
			 *
			 * The scroller is moved up delta-y amount.
			 *
			 * TODO: Update the delta value to ensure the clicked element is visible.
			 *
			 * TODO: different delta values based on the input element type.
			 */
			function updateScrollPosition() {
				try {
					var jQElem = $($element);
					if (self.keyboardHeight && self.scrollToInputEvent) {
						var deltaY = mobos.Viewport.screen().height
							- self.keyboardHeight
							- self.scrollToInputEvent.clientY;

						console.log("current:" + jQElem.scrollTop() + " deltaY:" + deltaY);

						if (deltaY < 0) {
							var shiftTo = jQElem.scrollTop() + Math.abs(deltaY);
							//console.log(shiftTo);
							jQElem.animate({scrollTop: shiftTo});

						}
					}
				} catch (e) {

				}
			}
		}

		return {
			restrict: "A",
			template: "<div ng-transclude class='scroll-container'></div>",
			transclude: true,
			require: 'row',
			priority: 1,
			link: {
				post: postLink,
				pre: preLink
			},
			controller: ['$scope', '$element', '$timeout', ScrollController]
		}

	}

	ScrollerDirective.$inject = ['$timeout'];

})();
