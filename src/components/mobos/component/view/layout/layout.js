/**
 * Created by rihdus on 19/4/15.
 */

;
(function () {

	angular.module('mobos.view')
		.directive('layout', LayoutDirective);

	function LayoutDirective($rootScope) {
		var LAYOUT_GRAVITY_FREE = "free",
			LAYOUT_GRAVITY_CENTER = "center",
			LAYOUT_GRAVITY_TOP = "top",
			LAYOUT_GRAVITY_BOTTOM = "bottom";

		var repaintListener_deRegister = null;

		// TODO(rihdus) Add center aligning row attribute.
		//  Auto computes row position and aligns at the center.
		//  On view resize, re-computes its position.

		/**
		 *
		 * @param scope
		 * @param elem
		 * @param attrs
		 * @param viewScope
		 */

		function preLink(scope, elem, attrs, viewScope) {
			//console.info("layout preLink");
			scope.viewScope = viewScope;

			scope.rows = {
				top: {},
				bottom: {},
				free: {}
			};

			resetLayoutParams(scope, viewScope);
		}

		function resetLayoutParams(scope, viewScope) {
			var viewParams = viewScope.params();
			scope.topStackHeight = 0;
			scope.bottomStackHeight = 0;
			scope.freeSpaceHeight = angular.copy(viewParams.content_height);

			scope.layout_position = {
				top: viewParams.content_top,
				bottom: viewParams.content_bottom
			}
		}

		function notifyRows(scope) {
			angular.forEach(scope._pendingRowDefer, function (pendingAddActions) {
				pendingAddActions.deferred.notify(pendingAddActions.row);
			});
		}

		function triggerRepaint(elem) {
			"use strict";
			setTimeout(function () {

				/**
				 * ref: https://gist.github.com/madrobby/1362093
				 * */

				if (mobos.Platform.isWebView && mobos.Platform.isIOS()) {
					elem[0].style.webkitTransform = 'rotateZ(0deg)';
					elem.addClass('clearfix');
					setTimeout(function () {
						elem.removeClass('clearfix');
					}, 10);
				}
			});
			// console.log('>>> repaint...');
		}

		function postLink(scope, elem, attrs, viewScope) {
			//console.info("layout postLink");
			updateLayout(scope, viewScope);
			computeRowProperties(scope, viewScope);
			notifyRows(scope);
			repaintListener_deRegister = $rootScope.$on('layout:repaint', function () {
				"use strict";
				triggerRepaint(elem);
			});
			scope.$on("$destroy", function () {
				destroy(scope);
			});

			viewScope.registerViewChangeListener().then(
				function () {
				},
				function () {
				},
				function onViewChangeNotification() {
					//console.info('layout on_view_resize');
					updateLayout(scope, viewScope);
					computeRowProperties(scope, viewScope);
					notifyRows(scope);
					triggerRepaint(elem);
				});

			function updateLayout() {
				var viewParams = viewScope.params();
				if (scope.positioning == 'absolute') {
					elem.css({
						'height': viewParams.height,
						'overflow': 'scroll'
					});
					console.log(elem);
				} else if (scope.positioning == 'fullScreenAutoScroll') {
					elem.css({
						'min-height': viewParams.height,
						'overflow': 'auto'
					});
				}

			}
		}

		function destroy(scope) {
			if (angular.isFunction(scope._deregister_view_resize)) {
				scope._deregister_view_resize();
			}
			if (angular.isFunction(repaintListener_deRegister)) {
				repaintListener_deRegister();
			}
		}

		function computeRowProperties(scope, viewScope) {
			resetLayoutParams(scope, viewScope);
			var viewParams = viewScope.params();

			// Top rows
			angular.forEach(scope.rows.top, function (row) {
				row.layout_position = {};
				row.layout_position.top = scope.layout_position.top + angular.copy(scope.topStackHeight);
				scope.topStackHeight += row.height;
				row.layout_position.bottom = angular.copy(scope.topStackHeight);
			});

			// bottom rows
			angular.forEach(scope.rows.bottom, function (row) {
				row.layout_position = {};
				row.layout_position.bottom = scope.layout_position.bottom + angular.copy(scope.bottomStackHeight);
				if (row.mvShow) {
					scope.bottomStackHeight += row.height;
				}
				row.layout_position.top = angular.copy(scope.bottomStackHeight);
			});

			// Free space compute
			angular.forEach(scope.rows.free, function (row) {
				scope.freeSpaceHeight =
					(viewParams.content_height -
					(scope.topStackHeight + scope.bottomStackHeight));
				row.layout_position = {
					height: scope.freeSpaceHeight,
					top: scope.layout_position.top + scope.topStackHeight,
					bottom: scope.layout_position.bottom + scope.bottomStackHeight
				};
				row.height = row.layout_position.height;
			});
		}

		function LayoutController($scope, $q) {

			$scope._pendingRowDefer = {};
			$scope._pendingViewChangeDefer = [];

			this.addRow = function (id, height, width, gravity, isShown) {
				var _id = id || Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);

				var deferred = $q.defer();
				switch (gravity) {
					case LAYOUT_GRAVITY_TOP:
						$scope.rows.top[_id] = {
							id: _id,
							height: height,
							width: width,
							gravity: gravity,
							layout_position: {},
							isShown: isShown
						};

						$scope._pendingRowDefer[_id] = {
							row: $scope.rows.top[_id],
							deferred: deferred
						};

						break;

					case LAYOUT_GRAVITY_BOTTOM:
						$scope.rows.bottom[_id] = {
							id: _id,
							height: height,
							width: width,
							gravity: gravity,
							layout_position: {},
							isShown: isShown
						};
						$scope._pendingRowDefer[_id] = {
							row: $scope.rows.bottom[_id],
							deferred: deferred
						};
						break;

					case LAYOUT_GRAVITY_FREE:
					case LAYOUT_GRAVITY_CENTER:
						$scope.rows.free[_id] = {
							id: _id,
							height: height,
							width: width,
							gravity: gravity,
							layout_position: {},
							isShown: isShown
						};
						$scope._pendingRowDefer[_id] = {
							row: $scope.rows.free[_id],
							deferred: deferred
						};
						break;

					default:
				}

				return deferred.promise;
			};

			this.layoutAttributes = function () {
				return {
					layoutHeight: $scope.layoutHeight,
					positioning: $scope.positioning
				}
			};

			this.getRowAttributes = function (rowId) {
				angular.forEach($scope.rows, function (rowType) {
					if (angular.isDefined(rowType[rowId])) {
						return rowType[rowId];
					}
				})
			}

		}

		return {
			restrict: "E",
			require: "^view",
			link: {
				pre: preLink,
				post: postLink
			},
			scope: {
				layoutHeight: '@',
				positioning: '@'
			},
			controller: ['$scope', '$q', LayoutController]
		}

	}

	LayoutDirective.$inject = ['$rootScope'];

})();
