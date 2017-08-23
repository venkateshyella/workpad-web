/**
 * Created by sudhir on 21/5/15.
 */


/**
 * Created by rihdus on 14/4/15.
 */

;
(function () {
	"use strict";

	angular.module('InterimComponent')
		.service('mDialog', ['$mdDialog', '$q', '$rootScope', '$device',
			'Lang', DialogProvider]);

	function DialogProvider($mdDialog, $q, $rootScope, $device, Lang) {

		/**
		 *
		 * Back button action in android devices should dismiss the dialog by default.
		 * this can be optionally disabled by 'canDismiss' flag in the options
		 * */

		var simpleDialogConfig = {
			templatePrefix: '<md-dialog class="dialog-custom" aria-label="{{dialogAriaLabel}}">' +
			'<md-dialog-content>',

			templatePostFix: '</md-dialog-content>' +
			'</md-dialog>',

			template: '<md-dialog class="dialog-custom" aria-label="{{dialogAriaLabel}}">' +
			'<md-dialog-content>' +
			'<div ng-include="templateUrl"></div>' +
			'</md-dialog-content>' +
			'</md-dialog>'
		};

		var defaultOptions = {
				clickOutsideToClose: true,
				escapeToClose: false
			},
			defaultAlertOptions = {
				clickOutsideToClose: false,
				escapeToClose: true
			},
			defaultConfirmOptions = {
				clickOutsideToClose: false,
				escapeToClose: true
			}
			;

		var DialogService = {
			showAlert: showAlert,
			alert: showAlert,
			showConfirm: showConfirm,
			confirm: showConfirm,
			show: show,
			showSimple: showSimple,
			showListDialog: showListDialog,
			showSearchSelector: showSearchSelector,
			hide:hide
			
		};
		return DialogService;

		/**
		 *
		 * @param options
		 * @returns {promise.promise|Function|*|jQuery.promise}
		 */
		function showAlert(opts) {
			var deferred = $q.defer(),
				deregisterBackbuttonFn = null
				;
			if (angular.isString(opts)) {
				opts = {
					content: opts,
					ok: "Ok"
				}
			}
			var options = angular.copy(defaultAlertOptions);
			angular.extend(options, opts);
			deregisterBackbuttonFn = $device.registerBackButtonAction(function () {
				if (options.clickOutsideToClose) {
					$mdDialog.cancel();
				} else {
					console.log("prevent alert dismiss by back button");
				}
			}, $device.PLATFORM_BACK_BUTTON_PRIORITY_POPUP);
			//if (options.clickOutsideToClose) {
			//  deregisterBackbuttonFn = $device.registerBackButtonAction(function () {
			//    $mdDialog.cancel();
			//  }, $device.PLATFORM_BACK_BUTTON_PRIORITY_POPUP);
			//}

			$rootScope.$broadcast('view:resize');
			$mdDialog.show($mdDialog.alert(options))
				.then(function (result) {
					deferred.resolve(result);
				}, function (reason) {
					deferred.reject(reason);
				}, function (noti) {
					deferred.notify(noti);
				})
				.finally(function () {
					deregisterBackbuttonFn && deregisterBackbuttonFn();
					$rootScope.$broadcast('layout:repaint')
				});
			return deferred.promise;
		}

		/**
		 * TODO(Sudhir): Add support for confirm string as options argument
		 *
		 * @param options
		 * @returns {promise.promise|Function|*|jQuery.promise}
		 */
		function showConfirm(opts) {
			var deferred = $q.defer(),
				deregisterBackbuttonFn = null
				;

			var options = angular.copy(defaultConfirmOptions);
			angular.extend(options, opts);
			deregisterBackbuttonFn = $device.registerBackButtonAction(function () {
				if (options.clickOutsideToClose) {
					$mdDialog.cancel();
				} else {
					console.log('prevent back button dismiss');
				}
			}, $device.PLATFORM_BACK_BUTTON_PRIORITY_POPUP);

			$rootScope.$broadcast('view:resize');
			$mdDialog.show($mdDialog.confirm(options))
				.then(function (result) {
					deferred.resolve(result);
				}, function (reason) {
					deferred.reject(reason);
				}, function (noti) {
					deferred.notify(noti);
				})
				.finally(function () {
					deregisterBackbuttonFn && deregisterBackbuttonFn();
					$rootScope.$broadcast('layout:repaint');
				});
			return deferred.promise;
		}
		
		function hide() {
			$mdDialog.hide();
		}

		/**
		 * Show a custom dialog with custom template and controller.
		 * Note: A 'templateUrl' is required in the options object 'opts'
		 * for the dialog to show up on screen.
		 *
		 * If a custom controller is not provided, a default dialog controller is attached.
		 * This default controller exposes 3 objects to the '$scope' object,
		 *  - 'locals': Can be used to bundle all the data that is required to be exposed to the view scope.
		 *  - 'LANG': Language assets.
		 *  - '$mdDialog': The dialog controller object can be used to show/hide the dialog.
		 *
		 * @param opts
		 * @returns {*}
		 */
		function show(opts) {
			var deferred = $q.defer()
				, locals = opts.locals
				, deregisterBackbuttonFn = null
				;

			var options = angular.copy(defaultOptions);
			angular.extend(options, opts);

			deregisterBackbuttonFn = $device.registerBackButtonAction(function () {
				if (options.clickOutsideToClose) {
					$mdDialog.cancel();
				} else {
					console.log('prevent dismiss by back button');
				}
			}, $device.PLATFORM_BACK_BUTTON_PRIORITY_POPUP);

			options.controller = options.controller || defaultDialogController;
			$rootScope.$broadcast('view:resize');
			$mdDialog.show(options)
				.then(function (result) {
					deferred.resolve(result);
				})
				.catch(function (reason) {
					deferred.reject(reason);
				})
				.finally(function () {
					deregisterBackbuttonFn && deregisterBackbuttonFn();
					$rootScope.$broadcast('layout:repaint')
				});
			return deferred.promise;

			function defaultDialogController($scope, $mdDialog) {
				//console.log(locals);
				$scope.locals = locals;
				$scope.$mdDialog = $mdDialog;
				$scope.LANG = Lang.en.data;
			}

			defaultDialogController.$inject = ['$scope', '$mdDialog'];
		}

		function showSimple(options) {
			var deferred = $q.defer();

			$rootScope.$broadcast('view:resize');
			$mdDialog.show({
					controller: ['$scope', '$mdDialog',
						SimpleDialogController],
					template: simpleDialogConfig.template,
					targetEvent: options.ev,
					locals: {
						templateUrl: options.templateUrl
					}
				})
				.then(function (result) {
					deferred.resolve(result)
				}, function (reason) {
					deferred.reject(reason);
				})
				.finally(function () {
					$rootScope.$broadcast('layout:repaint')
				})
			;
			return deferred.promise;


			function SimpleDialogController($scope, $mdDialog) {
				console.log('SimpleDialogController');
				$scope.$mdDialog = $mdDialog;

				$scope.dialogAriaLabel = $scope.dialogAriaLabel || "simpleDialog";
			}

		}


		/**
		 *
		 * Show a simple Select dialog.
		 *
		 * @param listItems
		 * @param options
		 * @returns {promise.promise|Function|*|jQuery.promise}
		 */

		// TODO(Sudhir) Add optional icons for select items.

		function showListDialog(listItems, opts) {
			var deferred = $q.defer(),
				deregisterBackbuttonFn = null
				;
			var selectItems = listItems;

			var options = angular.copy(defaultOptions);
			angular.extend(options, opts);
			if (options.clickOutsideToClose) {
				deregisterBackbuttonFn = $device.registerBackButtonAction(function () {
					$mdDialog.cancel();
				}, $device.PLATFORM_BACK_BUTTON_PRIORITY_POPUP);
			}

			options.controller = ['$scope', '$mdDialog',
				ListSelectorDialogController];
			options.templateUrl =
				'components/mobos/component/dialog/listSelectDialog/listSelectDialog.dialog.tpl.html';
			options.targetEvent = options.$event;
			options.locals = {
				listItems: listItems | []
			};

			$rootScope.$broadcast('view:resize');
			$mdDialog.show(options)
				.then(function (result) {
					deferred.resolve(result)
				}, function (reason) {
					deferred.reject(reason);
				})
				.finally(function () {
					deregisterBackbuttonFn && deregisterBackbuttonFn();
					$rootScope.$broadcast('layout:repaint')
				});
			return deferred.promise;


			function ListSelectorDialogController($scope, $mdDialog) {
				$scope.$mdDialog = $mdDialog;

				$scope.data = {
					selectItems: selectItems
				};
				$scope.$onListItemSelect = onListItemSelect;

				$scope.dialogAriaLabel = $scope.dialogAriaLabel || "simpleDialog";

				function onListItemSelect(item) {
					$mdDialog.hide(item);
				}
			}
		}

		function showSearchSelector(queryService, options) {
			var deferred = $q.defer()
				, _options = options || {}
				;

			_options.itemListUrl
				= options.itemListUrl || 'components/mobos/component/dialog/tempaltes/select-item-default.partial.html';

			$rootScope.$broadcast('view:resize');
			$mdDialog.show({
					templateUrl: 'components/mobos/component/dialog/tempaltes/Search-and-select-dialog.tpl.html',
					controller: ['$scope', '$mdDialog', '$timeout',
						'options', 'queryService',
						SearchSelectDialogController],
					locals: {
						queryService: queryService,
						options: _options
					},
					controllerAs: 'selectCtrl'
				})
				.then(function (jobModel) {
						deferred.resolve(jobModel)
					}
					, function (event) {
						deferred.notify(event)
					})
				.catch(function () {
					deferred.reject();
				})
				.finally(function () {
					$rootScope.$broadcast('layout:repaint')
				})
			;

			return deferred.promise;

			function SearchSelectDialogController($scope, $mdDialog, $timeout, options, queryService) {
				var self = this;

				self.cancel = $mdDialog.cancel;
				self.onListItemSelect = onListItemSelect;

				self.isLoading = angular.isFunction(queryService.isLoading)
					? queryService.isLoading
					: function () {
					return false;
				};

				$scope.options = options;
				$scope.results = [];

				runQuery();

				function runQuery() {
					return queryService.fn()
						.then(function (results) {
							$scope.results = results;
						}, function (event) {
							console.log(event);
						})
						.catch(function (err) {
						});
				}

				function onListItemSelect(result) {
					$mdDialog.hide(result);
				}
			}

		}

	}

})();
