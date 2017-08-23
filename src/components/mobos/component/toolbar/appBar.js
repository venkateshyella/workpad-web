;
(function () {

	angular.module("Toolbar")
		.directive('appToolbar', AppToolbarDirective);

	/**
	 *
	 * App toolbar directive. Adds a toolbar to a view.
	 *
	 * TODO: Component registry integration.
	 * TODO: Show hide animations for overlay toolbars.
	 *
	 */
	function AppToolbarDirective($compile, State, DrawerService, $mdSidenav, $mdUtil, $Constant) {
		var TAG = '[appToolbar] ';
		var APP_ICON_STATE = {
			NAVIGATE_BACK: "nav-back",
			NAVIGATE_UP: "nav-up",
			OPEN_DRAWER: "open-drawer"
		};
		var eventDeRegisterBucket = {};

		// @formatter:off
		var appBarHomeContentString_old =
			'<div class="menu-option-item" ng-click="$onAppIconClick()">' +
			'<div class="toolbar-title">' +
			'<div class="appIcon icon {{appIcon}}"></div>' +
			'</div>' +
			'<span class="toolbar-text" ng-bind="title"></span>' +
			'</div>';
		// @formatter:on

		// @formatter:off
		var appBarHomeContentString = "";
		/*	if(!mobos.Platform.isWebView()){
				appBarHomeContentString = '<md-button ng-if="hasSideMenu" ng-show="appIcon==\'icon-arrow-back\'" class="toolbar-button appHome-icon" ' +
					'ng-click="$openSideMenu()" aria-label="App Home">' +
				'<md-icon class="toolbar-icon" md-font-icon="icon icon-menu toolbar-icon"></md-icon>' + 
				'</md-button>';
			} */
			appBarHomeContentString = appBarHomeContentString+ '<md-button class="toolbar-button appHome-icon" ' +
					'ng-click="$onAppIconClick()" aria-label="App Home">' +
					'<md-icon class="toolbar-icon" md-font-icon="icon {{appIcon}} toolbar-icon"></md-icon>' +
				'</md-button>' + 
				'<div class="toolbar-title">' +
					'<div class="toolbar-text" ng-bind="title"></div>' +
					'<div class="toolbar-subtitle" ng-bind="subTitle">Sub Title</div>' +
				'</div>'
			;
		// @formatter:on

		function preLink(scope, elem, attrs, ctrls) {
			var toolbarCtrl = ctrls[0];
			var viewCtrl = ctrls[1];
			var hasSideMenuVal = scope.$eval(angular.isDefined(attrs.menu) ? attrs.menu : "true");
			scope.appIcon = '';//(!mobos.Platform.isWebView())?'icon-menu': '';
			scope.hasSideMenu = !!hasSideMenuVal;
			scope.title = scope.$eval(attrs.title) || viewCtrl.title;
			scope.$parent.$watch(attrs.title, function (value) {
				"use strict";
				scope.title = value || scope.$eval(attrs.title);
			});

			scope.subTitle = scope.$eval(attrs.subTitle) || viewCtrl.subTitle;
			scope.$parent.$watch(attrs.subTitle, function (value) {
				"use strict";
				scope.subTitle = value || scope.$eval(attrs.subTitle);
			});

			scope.appIconState = APP_ICON_STATE.OPEN_DRAWER;

			if (mobos.Platform.isIOS()) {
				elem.css({
					'height': viewCtrl.viewToolbarHeight + 'em',
					'padding-top': $Constant.IOS_STATUS_BAR_HEIGHT + 'em'
				});
			}
			scope.$onAppIconClick = function (event) {
				if (scope.appIconState == APP_ICON_STATE.NAVIGATE_BACK) {
					State.transitionBack();
				} else {
					//DrawerService('appNav').open();
					toggleLeftNav();
				}
			};

			scope.$openSideMenu = function () {
				"use strict";
				toggleLeftNav();
			};

			function buildToggler(navID) {
				var debounceFn = $mdUtil.debounce(function () {
					$mdSidenav(navID)
						.toggle();
				}, 300);
				return debounceFn;
			}

			viewCtrl.addViewToolbar(this, elem);
			var toggleLeftNav = function(){};//buildToggler('appLeftNav');
			updateAppNavigation(scope);

			scope.titleEl = $compile(appBarHomeContentString)(scope);

			if ($(elem[0]).find('.toolbar-title').length > 0) {
			} else {
				toolbarCtrl.addHomeEl(scope.titleEl);
			}
			scope.appIconElem = scope.titleEl.find(".appIcon");
			
			elem.attr('title', '');
		}

		function updateAppNavigation(scope) {
			if (State.prev()) {
				scope.appIconState = APP_ICON_STATE.NAVIGATE_BACK;
				scope.appIcon = 'icon-arrow-back';
			}/* else {
				scope.appIconState = APP_ICON_STATE.OPEN_DRAWER;
				scope.appIcon = 'icon-menu';
			}*/
		}

		function registerEventListeners(scope, elem) {
			scope.$on('$destroy', unRegisterEventListeners);
		}

		function unRegisterEventListeners() {
			angular.forEach(eventDeRegisterBucket, function (deRegisterFn) {
				deRegisterFn();
			});
			eventDeRegisterBucket = {};
		}

		function postLink(scope, elem, attrs, toolbarCtrl) {
			registerEventListeners(scope, elem);
		}

		function ToolbarController($scope) {
		}

		return {
			restrict: 'A',
			priority: 1,
			scope: true,
			require: ['toolbar', '^view'],
			link: {
				pre: preLink,
				post: postLink
			},
			controller: ['$scope', ToolbarController]
		}

	}

	AppToolbarDirective.$inject = ['$compile', 'State', 'DrawerService', '$mdSidenav', '$mdUtil', '$Constant'];

})();
