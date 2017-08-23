/**
 * Created by sudhir on 13/1/16.
 */

angular.module('app')
	.service('VaultFileRename', [
		'mDialog', '$q', 'DataProvider',
		'blockUI', 'Lang',
		function (Dialog, $q, DataProvider, blockUI, Lang) {
			"use strict";

			var LANG = Lang.en.data;
			var defaultRenameFilesDialogConfig = {
				templateUrl: "app/modules/vault/workflow/template/rename-files.dialog.tpl.html",
				actionButtonText: "Rename",
				cancelButtonText: "Cancel"
			};

			return {
				renameFiles: renameFiles
			};

			function renameFiles(fileList, cb_del_action, dialogConfig) {
				var _dialogConfig = angular.extend({}, defaultRenameFilesDialogConfig, dialogConfig);
				var deferred = $q.defer();

				Dialog.show({
						templateUrl: _dialogConfig.templateUrl,
						controller: ['$mdDialog', '$scope',
							FileRenameDialogController],
							clickOutsideToClose:false
					})
					.then(function (res) {
						deferred.resolve(res)
					})
					.catch(function (err) {
						deferred.reject(err)
					});

				return deferred.promise;

				function FileRenameDialogController($mdDialog, $scope) {
					angular.extend($scope, {
						fileList: angular.copy(fileList),
						config: _dialogConfig,
						form: {},
						cancel: function () {
							$mdDialog.hide()
						},
						action: function () {
							if ($scope.form.fileNames.$invalid) {
								return;
							}
							var updatedFilesList = _.chain($scope.fileList)
								.filter(function (file) {
									return !!file.isDirty
										&& file.newName && file.newName.length > 0;
								}).map(function (file) {
									return {
										id: file.id,
										fileDisplayName: file.newName
									}
								})
								.value();

							if (updatedFilesList.length == 0) {
								return;
							}

							if (angular.isFunction(cb_del_action)) {
								$q.when(cb_del_action(updatedFilesList))
									.then(function (res) {
										$mdDialog.hide(res);
									},null,function(rawResponse){
										deferred.notify(rawResponse);
										console.log(rawResponse);
									})
									.catch(function (err) {
										blockUI.stop(err.respMsg, {
											status: 'isError',
											action: LANG.BUTTON.OK
										});
										$mdDialog.cancel(err)
									})
							}
						},
						onFileNameChange: function (file) {
							file.isDirty = true;

						}
					})
				}
			}
		}

	])
;