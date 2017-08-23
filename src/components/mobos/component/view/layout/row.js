/**
 * Created by rihdus on 19/4/15.
 */

;
(function () {

	angular.module('mobos.view')
		.directive('row', RowDirective);

	function RowDirective() {

		var LAYOUT_GRAVITY_FREE = "free";
		// var REGEX_HTML_LENGTH = /^((\d?.?\d)+(px|em|rem)|(fill_remaining))$/;
		var REGEX_HTML_LENGTH = /^([0-9.0.9]+(px|em|rem)|(fill_remaining))$/;

		function splitHtmlUnit(str) {
			var res = str.split(REGEX_HTML_LENGTH);
			return {
				value: res[1],
				unit: res[2]
			}
		}

		function preLink(scope, elem, attrs, layoutCtrl) {
			//console.info("row preLink");
			scope.rowProperties = {
				height: splitHtmlUnit(attrs.layoutHeight)
			};
			scope.attrs = attrs;
			scope.rowProperties.height.unit = scope.rowProperties.height.unit || 'em';
			scope.layoutAttributes = layoutCtrl.layoutAttributes();
			//updateRowEl(elem, scope);

			var rowId = layoutCtrl.addRow(
					scope.componentId || scope.id,
				parseFloat(scope.layoutHeight),
				"100%",
					scope.layoutGravity || LAYOUT_GRAVITY_FREE,
				scope.mvShow)
				.then(function (row) {
					}, function () {
					},
					function (row) {
						scope.layoutHeight = row.height;
						scope.rowProperties.layout_position = row.layout_position;
						updateRowEl(elem, scope);
						updateRowPosition(elem, row, scope);
						angular.forEach(scope._pendingRowUpdateDefer, function (rowUpdateDefer) {
							rowUpdateDefer.notify();
						})
					});

			function updateRowEl(elem, scope) {
				var rowCssProperties = {};
				if (mobos.Platform.isIOS()) {
					if (scope.attrs.layoutHeight !== 'fill_remaining') {
						rowCssProperties['height'] = parseFloat(scope.layoutHeight) + scope.rowProperties.height.unit;
					}
					if (scope.layoutGravity == 'center') {
						rowCssProperties['height'] = 'auto';
						$(elem[0])
							.children('.scroll-container')
							.attr('layout', 'row')
							.attr('layout-align', 'center center')
							//.addClass('scroll-box')
						;
					}
				} else {
					if (scope.layoutGravity == 'free') {
						//rowCssProperties['height'] = 'auto';
						rowCssProperties['height'] = ($(window).height() - 65) + 'px';
						rowCssProperties['overflow-y'] =  'auto';
					}
					if (scope.layoutGravity == 'center') {
						$(elem[0])
							.children('.scroll-container')
							.css({
								'position': 'fixed',
								'overflow': 'scroll',
								'width': '100%',
								'left': '0',
								'top': scope.rowProperties.layout_position.top + scope.rowProperties.height.unit,
								'bottom': scope.rowProperties.layout_position.bottom + scope.rowProperties.height.unit
							})
							.attr('layout', 'row')
							.attr('layout-align', 'center center')
							//.addClass('scroll-box')
						;
					} else {
						if (scope.attrs.layoutHeight !== 'fill_remaining') {
							rowCssProperties['height'] = parseFloat(scope.layoutHeight) + scope.rowProperties.height.unit;
						}
					}
				}
				elem.css(rowCssProperties);
			}


			function updateRowPosition(elem, rowAttributes, scope) {
				//console.info('update row position');
				var u = scope.rowProperties.height.unit;
				var rowCssAttributes = {};
				switch (rowAttributes.gravity) {
					case 'top':
						rowCssAttributes.top = 0 +u;//parseFloat(rowAttributes.layout_position.top) + u;
						break;
					case 'bottom':
						if (mobos.Platform.isIOS()) {
							rowCssAttributes.bottom = parseFloat(rowAttributes.layout_position.bottom) + u;
						} else {
							rowCssAttributes['margin-bottom'] = parseFloat(rowAttributes.layout_position.bottom) + u;
						}
						break;
					case 'free':
					case 'center':
						var position_top = 0.7; //parseFloat(rowAttributes.layout_position.top);
						var position_bottom = parseFloat(rowAttributes.layout_position.bottom);

						if (!u) u = 'em';

						if (mobos.Platform.isIOS()) {
							rowCssAttributes['position'] = 'absolute';
							rowCssAttributes['top'] = position_top + u;
							rowCssAttributes['bottom'] = position_bottom + u;
						} else {
							if (layoutCtrl.layoutAttributes().positioning == 'fullScreenAutoScroll') {
								rowCssAttributes['position'] = 'initial';
								rowCssAttributes['min-height'] = scope.layoutHeight + '';
								//rowCssAttributes['padding-bottom'] = rowAttributes.layout_position.bottom+u;
								//rowCssAttributes['padding-top'] = rowAttributes.layout_position.top+u;
							} else {
								rowCssAttributes['padding-top'] = position_top + u;
								rowCssAttributes['padding-bottom'] = position_bottom + u;
							}
						}
						break;
				}

				elem.css(rowCssAttributes);
			}
		}

		function postLink(scope, elem, attrs, layoutCtrl) {
			//console.info("row postLink");
			scope.$on('$destroy', function () {
				destroy(scope);
			});
			try {
				if (mobos.Platform.isIOS()) {
					scope.scrollableEl = $(elem[0])
						.children('.scroll-container')[0];
				} else if (mobos.Platform.isAndroid()) {
					scope.scrollableEl = document.body;
				}
			} catch (e) {

			}
		}

		function destroy(scope) {
			if (angular.isFunction(scope._deregister_reposition_rows)) {
				scope._deregister_reposition_rows();
			}
			if (scope.deRegister_rowScrollEventListener) {
				scope.deRegister_rowScrollEventListener();
				scope.angular.deRegister_rowScrollEventListener = null;
			}
		}

		function RowController($scope, $q) {
			$scope._pendingRowUpdateDefer = [];

			this.rowScope = $scope;

			this.registerViewChangeListener = function () {
				var deferred = $q.defer();

				$scope._pendingRowUpdateDefer.push(deferred);

				return deferred.promise;
			};
			this.layoutAttributes = function () {
				return $scope.layoutAttributes
			}

			this.updateScroll = function (scrollData) {
				"use strict";
				switch (scrollData.scrollTo) {
					case 'bottom':
						if ($scope.scrollableEl) {
							mobos.DomUtil.scrollToBottom($scope.scrollableEl);
						}
						break;
					case 'top':
						if ($scope.scrollableEl) {
							mobos.DomUtil.scrollToTop($scope.scrollableEl);
						}
						break;
				}
			};
			
			this.updateWebScroll = function (scrollData) {
				"use strict";
				switch (scrollData.scrollTo) {
					case 'bottom':
						if ($scope.scrollableEl) {
							$scope.scrollableEl = $('.scroll-container')[0];
							$scope.scrollableEl = $scope.scrollableEl.children[0].children[1];
							$scope.scrollableEl && mobos.DomUtil.scrollToBottom($scope.scrollableEl);
							//mobos.DomUtil.scrollToBottom($scope.scrollableEl);
						}else{
							$scope.scrollableEl = $('.scroll-container')[0];
							$scope.scrollableEl = $scope.scrollableEl.children[0].children[1];
							$scope.scrollableEl && mobos.DomUtil.scrollToBottom($scope.scrollableEl);
						}
						break;
					case 'top':
						if ($scope.scrollableEl) {
							mobos.DomUtil.scrollToTop($scope.scrollableEl);
						}
						break;
				}
			};
		}

		return {
			restrict: "E",
			require: "^^layout",
			priority: 0,
			scope: {
				componentId: '@',
				id: '@',

				mvShow: '=',


				/**
				 * layoutHeight sets the height of the row in the layout
				 * should be 'fill_remaining' or css 'px' unit
				 */
				layoutHeight: "@",  // Mandatory
				layoutWidth: "@",

				/**
				 * layoutGravity specifies the alignment of the row in the layout.
				 * allowed values: 'top', 'bottom' or 'free'
				 */
				layoutGravity: "@"  // Mandatory
			},
			link: {
				pre: preLink,
				post: postLink
			},
			controller: ['$scope', '$q', RowController]
		}

	}

	RowDirective.$inject = []

})();
