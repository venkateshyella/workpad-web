/**
 * Created by sudhir on 13/1/16.
 */

angular.module('app')
	.service('VaultFilesWorkflow', [
		'mDialog', '$q', 'DataProvider',
		'AppCoreUtilityServices', '$mdToast',
		'blockUI', 'Lang',
		function (Dialog, $q, DataProvider
			, AppCoreUtilityServices, $mdToast
			, blockUI, Lang) {
			"use strict";

			var LANG = Lang.en.data;
			var defaultSelectExecDialogConfig = {
				templateUrl: "app/modules/vault/workflow/template/select-exec.dialog.tpl.html",
				selectAllText: LANG.LABEL.SELECT_ALL,
				actionButtonText: "Action",
				cancelButtonText: "Cancel"
				
			};

			var defaultFilesCopyDialogConfig = {
				templateUrl: "app/modules/vault/workflow/template/file-copy.dialog.tpl.html",
				selectAllText: LANG.LABEL.SELECT_ALL,
				actionButtonText: "Copy",
				cancelButtonText: "Cancel" 
				
			};

			return {
				selectAndExecuteActionOnFiles: selectAndExecuteActionOnFiles,
				selectAndCopyFiles: selectAndCopyFiles
			};

			function selectAndCopyFiles(fileList, cb_copy, cb_destination, dialogConfig) {
				var _dialogConfig = angular.extend({}, defaultFilesCopyDialogConfig, dialogConfig);
				var deferred = $q.defer();

				Dialog.show({
						templateUrl: _dialogConfig.templateUrl,
						controller: ['$mdDialog', '$scope',
							FileCopyDialogController],
							clickOutsideToClose:false
					})
					.then(function (res) {
						deferred.resolve(res)
					})
					.catch(function (err) {
						deferred.reject(err)
					});

				return deferred.promise;

				function FileCopyDialogController($mdDialog, $scope) {
					var multiSelectList = AppCoreUtilityServices.multiSelectScopeControllerFactory(fileList);
					var isActionInProgress = false;
					angular.extend($scope, {
						fileList: fileList,
						config: _dialogConfig,
						selectedDestination: null,
						selectAllText: LANG.LABEL.SELECT_ALL,
						FLAG: {
							isDestinationSelected: false,
							isSrcFilesSelected: false
						},
						cancel: function () {
							$mdDialog.hide()
						},
						multiSelectList: multiSelectList,
						action: function () {
							if (isActionInProgress) return;
							var selectedItems = multiSelectList.getItems(true);
							if (selectedItems.length == 0) {
								return;
							}
							isActionInProgress = true;
							if (angular.isFunction(cb_copy)) {
								cb_copy(multiSelectList.getItems(true), $scope.selectedDestination)
									.then(function (res) {
										blockUI.reset();
										$mdDialog.hide(res);
									})
									.catch(function (err) {
										var errMsg = (err && err.respMsg) || LANG.ERROR.DEFAULT;
										blockUI.stop(errMsg, {
											status: 'isError',
											action: LANG.BUTTON.OK
										});
									})
									.finally(function () {
										isActionInProgress = false;
									})
							}
						},
						action_toggleSelectDestination: function () {
							$scope.FLAG.isSrcFilesSelected = !$scope.FLAG.isSrcFilesSelected;
							$scope.FLAG.isSrcFilesSelected && $scope.action_selectDestination(null);
						},
						action_selectDestination: function (destination) {
							_.each($scope.destinationList, function (dest) {
								dest.isSelected = false;
							});
							$scope.selectedDestination = destination;
							destination && (destination.isSelected = true);
						},
						trackDestinationBy: function (value) {
							return value.id + '-' + value.catType;
						},
						loadFiles: loadFiles
					});

					loadFiles();

					function loadFiles() {
						if ($scope.destinationList) return $scope.destinationList;
						return $q.when(cb_destination())
							.then(function (results) {
								$scope.destinationList = results;
								return results;
							})
							.catch(function (err) {
								$scope.destinationList = null;
								return err;
							})
							;
					}
				}
			}

			/**
			 * Send a delete request for a given list of files
			 * @param fileList
			 * @param cb_action
			 * @param dialogConfig
			 */
			function selectAndExecuteActionOnFiles(fileList, cb_action, dialogConfig) {
				var _dialogConfig = angular.extend({}, defaultSelectExecDialogConfig, dialogConfig);
				var deferred = $q.defer();

				Dialog.show({
						templateUrl: _dialogConfig.templateUrl,
						controller: ['$mdDialog', '$scope',
							SelectAndExecController],
							clickOutsideToClose:false
					})
					.then(function (res) {
						deferred.resolve(res)
					})
					.catch(function (err) {
						deferred.reject(err)
					});

				return deferred.promise;

				function SelectAndExecController($mdDialog, $scope) {
					var opts = {};
					if(dialogConfig.ignoreItemSelection){
						opts.ignoreItemSelection = true;
					}
					var multiSelectList = AppCoreUtilityServices.multiSelectScopeControllerFactory(fileList, opts);
					var isActionInProgress = false;
					angular.extend($scope, {
						fileList: fileList,
						config: _dialogConfig,
						cancel: function () {
							$mdDialog.hide()
						},
						multiSelectList: multiSelectList,
						action: function () {
							if (isActionInProgress) return;
							if (multiSelectList.getItems(true).length == 0) {
								return;
							}
							isActionInProgress = true;
							if (angular.isFunction(cb_action)) {
								$q.when(cb_action(multiSelectList.getItems(true)))
									.then(function (res) {
										blockUI.reset();
										$mdDialog.hide(res);
									})
									.catch(function (err) {
										blockUI.stop();
										$mdDialog.cancel(err)
									})
									.finally(function () {
										isActionInProgress = false;
									})
							}
						}
					})
				}
			}
		}
	]);