/**
 * Created by sudhir on 21/3/16.
 */

(function () {
	"use strict";
	angular.module('FilePicker')
		.service('FileSystem', [
			'$q', '$timeout', '$rootScope', 'iCloudDocumentPicker', 'FileObject',
			'$mdBottomSheet', '$mdToast', '$cordovaCamera',
			'APP_BROADCAST',
			FileSystem
		])
	;

	/**
	 * @desc Local file system access APIs.
	 *
	 * @param $q
	 * @returns {{showFilePicker: pickFile, resolveFileContent: resolveAndroidFileContent}}
	 * @constructor
	 */
	function FileSystem($q, $timeout, $rootScope, iCloudDocumentPicker, FileObject
		, $mdBottomSheet, $mdToast, $cordovaCamera
		, APP_BROADCAST) {

		var _state = {
				initDone: false
			}
			, _fileFormat = {
				name: null,
				type: null,
				size: 0,
				dataUrl: null,
				data: {}
			}
			, savedImport = null
			;
		var pictureDefaults = {
			destinationType: Camera.DestinationType.FILE_URI,
			sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
			allowEdit: false,
			saveToPhotoAlbum: false
		};

		$rootScope.$on(APP_BROADCAST.IOS_DOCUMENT_IMPORT, function (event, data) {
			console.log('new import..');
		});

		return {
			clearSavedImports: clearSavedImports,
			deleteFileEntry: deleteFileEntry,
			saveNewImport: function (newFileImport) {
				if (savedImport && savedImport.fileEntry) {
					console.log('removing old imported file..');
					savedImport.fileEntry.remove(null, function (err) {
						console.error('failed to remove file', err);
					})
				}
				var toastMessage = 'New file "' + newFileImport.fileName + '" is saved for upload.';
				$mdToast.show(
					$mdToast.simple()
						.content(toastMessage)
						.position('bottom right')
						.hideDelay(4000))
				;
				savedImport = newFileImport;
			},
			pickFile: pickFile,
			resolveFileContent: resolveAndroidFileContent,
			initialize: function () {
				_state.initDone = true;
			}
		};

		function clearSavedImports() {
			if (mobos.Platform.isWebView() && mobos.Platform.isIOS()) {
				var IOS_IMPORT_DIR = cordova.file.documentsDirectory + '/Inbox';
				var deferred = $q.defer();


				window.resolveLocalFileSystemURI(IOS_IMPORT_DIR, function (dirEntry) {
					if (dirEntry && dirEntry.isDirectory) {
						dirEntry.createReader().readEntries(
							function onReadSuccess(fileEntries) {
								var fileRemoveActions = [];
								console.log('removing files', _.pluck(fileEntries, 'name'));
								// Remove all entries
								fileEntries.forEach(function (fileEntry) {
									fileRemoveActions.push(deleteFileEntry(fileEntry));
									$q.all(fileRemoveActions)
										.then(function () {
											deferred.resolve();
										})
										.catch(function (err) {
											deferred.reject(err);
										})
								})
							},
							function onReadError(error) {
								console.error(error);
							})
					} else {
						console.log('saved import directory not found');
						deferred.resolve();
					}
				});

				return deferred.promise;
			}

			else $timeout(angular.noop, 0);
		}

		function deleteFileEntry(fileEntry) {
			var deferred = $q.defer();
			console.log('removing file', fileEntry.name, fileEntry);
			fileEntry.remove(
				function onFileRemoveSuccess() {
					deferred.resolve();
				},
				function onFileRemoveError(err) {
					deferred.reject(err);
				});

			return deferred.promise;
		}

		function pickFile(options) {
			var deferred = $q.defer();
			if (mobos.Platform.isWebView()) {
				_state.isActive = true;
				if (mobos.Platform.isAndroid()) {
					showAndroidFilePicker(options, onFilePickSuccess, onFilePickFail)
				} else if (mobos.Platform.isIOS()) {
					showIOSFilePicker(options, onFilePickSuccess, onFilePickFail)
				} else {
					// Invalid platform.
					deferred.reject();
				}
			} else {
				alert("Native file chooser invoked in browser. Emulating mock file object");
				deferred.resolve(new FileObject("Mock file name", 'mockFile/type',
					123456, "fileDataUrl://...", {}));
			}

			return deferred.promise;

			function showAndroidFilePicker(options, win, fail) {
				fileChooser.open(
					function onFilePickSuccess(contentUri) {
						var newFile = angular.copy(_fileFormat);
						newFile.dataUrl = contentUri;
						newFile.data.contentUri = contentUri;
						resolveAndroidFileContent(contentUri)
							.then(function (documentContract) {
								newFile.name = documentContract._display_name;
								newFile.displayName = angular.copy(newFile.name);
								newFile.size = parseInt(documentContract._size);
								win(newFile, options);
							})
							.catch(function (error) {
								fail(error);
							})
					},
					function onFilePickError(error) {
					});
			}

			function showIOSFilePicker(options, win, fail) {
				$mdBottomSheet.show({
					templateUrl: 'components/angular-material/bottom-sheet/bottom-sheet-list.tpl.html',
					controller: ['$scope', '$mdBottomSheet',
						function ($scope, $mdBottomSheet) {
							$scope.subHeader = "Select File Source";
							$scope.items = [
								//{type: "ICLOUD", name: 'iCloud', icon: 'icon-left icon icon-cloud'},
								//{type: "PHOTOLIBRARY", name: 'Gallery', icon: 'icon-left icon icon-photo-library'},
								{type: "SAVEDPHOTOALBUM", name: 'Photo Album', icon: 'icon-left icon icon-picture'}
							];
							if (savedImport) {
								$scope.items.push({type: "IMPORT", name: 'Imported', icon: 'icon-left icon icon-'});
							}
							$scope.listItemClick = function ($index) {
								var clickedItem = $scope.items[$index];
								$mdBottomSheet.hide(clickedItem);
							};
						}]
				}).then(function (item) {
					switch (item.type) {
						case 'ICLOUD':
							iCloudDocumentPicker.pickFile()
								.then(function (res) {
									deferred.resolve(res);
								}, null, function (noti) {
									deferred.notify(noti);
								})
								.catch(function (err) {
									deferred.reject(err);
								});
							break;

						case 'IMPORT':
							var importedFile = new FileObject(savedImport.fileName,
								'',
								savedImport.size, savedImport.fileUri, savedImport.fileEntry);
							deferred.resolve(importedFile);
							break;

						case 'SAVEDPHOTOALBUM':
						default:
							$cordovaCamera.getPicture(pictureDefaults)
								.then(function (imgUri) {
									var path = imgUri
										, name = Math.random().toString(36).substr(2, 5) + '.jpg'
										, type = null
										, size = 0
										;

									resolveIOSFileContent(imgUri)
										.then(function (file) {
											console.log(file);
											name = file.name;
											size = file.size;
											deferred.resolve(new FileObject(name, type, size, path, null));
										})
										.catch(function (err) {
											deferred.reject(err);
										})
									;
								}).catch(function (reason) {
								deferred.reject(reason);
							});
							break;
					}
					savedImport = null;
				})
				;
			}

			function onFilePickSuccess(fileObject, options) {
				deferred.resolve(fileObject);
				//showFilePickerConfirmDialog(fileObject, options)
				//  .then(function() {
				//  })
				//  .catch(function() {
				//    deferred.reject(fileObject);
				//  })
				//;
			}

			function onFilePickFail(error) {
				deferred.reject(error);
			}

		}

		/**
		 *
		 * @desc
		 * @ref https://github.com/danjarvis/cordova-plugin-document-contract#usage
		 * @param contentUri
		 * @param options
		 */
		function resolveAndroidFileContent(contentUri, options) {
			// Outputs
			// {
			//   '_display_name': 'SampleFile.pdf',
			//   'document_id': 'foo123',
			//   'last_modified': '/SomeDate/',
			//   'mime_type': 'application/pdf',
			//   'nth key': 'nth value'
			// }
			var deferred = $q.defer();
			var result = {};
			window.plugins.DocumentContract.getContract({
					uri: contentUri
				},
				function (contract) {
					result = angular.copy(contract);
					deferred.resolve(result);
				},
				function (error) {
					console.log('Error getting contract: ' + error);
					deferred.reject(error);
				}
			);

			return deferred.promise;
		}

		function resolveIOSFileContent(imageUri, options) {
			var deferred = $q.defer();
			window.resolveLocalFileSystemURI(imageUri, function (fileEntry) {
				fileEntry.file(function (fileObj) {
					deferred.resolve(fileObj);
				});
			}, function (err) {
				deferred.reject(err);
			});

			return deferred.promise;
		}
	}

})();