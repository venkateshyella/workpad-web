/**
 * Created by sudhir on 13/7/15.
 */

;
(function () {
	"use strict";

	angular.module('FilePicker', ['ngCordova', 'ngMaterial'])

		.directive('inputFileModel', [
			'fileReader',
			InputFileModel])

		.factory('fileReader', [
			'$q', '$log',
			fileReader
		])

		.factory('FileObject', [
			function () {
				return FileObject;
			}
		])
	;

	/**
	 * @desc Update a regular ngModel directive to watch for input[type=file] changes.
	 *  Changes are propagated through regilar ngModel flow.
	 * @param $parse
	 * @returns {{scope: {}, require: string, link: postLink}}
	 * @constructor
	 */
	function InputFileModel(fileReader) {

		var config = {};

		return {
			scope: {},
			require: 'ngModel',
			link: postLink
		};

		function postLink(scope, element, attrs, ngModelCtrl) {
			var files = [];
			element.bind('change', onInputElementChange);

			function onInputElementChange(event) {
				files = element[0].files || [];

				if (files.length > 0) {
					/**
					 * Update model value.Oapp
					 * Updating model value triggers any ngChange handlers.
					 */
					ngModelCtrl.$setViewValue(files);
				}
			}
		}

	}

	function fileReader($q, $log) {

		var IMAGE_FILE_EXT_REGEX = /^(png|jpeg|jpg|bmp)$/;

		var onLoad = function (reader, deferred, scope) {
			return function () {
				scope.$apply(function () {
					deferred.resolve(reader.result);
				});
			};
		};

		var onError = function (reader, deferred, scope) {
			return function () {
				scope.$apply(function () {
					deferred.reject(reader.result);
				});
			};
		};

		var onProgress = function (reader, scope) {
			return function (event) {
				scope.$broadcast("fileProgress",
					{
						total: event.total,
						loaded: event.loaded
					});
			};
		};

		var getReader = function (deferred, scope) {
			var reader = new FileReader();
			reader.onload = onLoad(reader, deferred, scope);
			reader.onerror = onError(reader, deferred, scope);
			reader.onprogress = onProgress(reader, scope);
			return reader;
		};

		var readAsDataURL = function (file, scope) {
			var deferred = $q.defer();

			var reader = getReader(deferred, scope);
			reader.readAsDataURL(file);

			return deferred.promise;
		};

		function isImage(file) {
			var fileName = file.name;
			var ext = fileName
				.substr(fileName.lastIndexOf('.') + 1)
				.toLowerCase();
			return !!IMAGE_FILE_EXT_REGEX.test(ext);
		}

		return {
			readAsDataUrl: readAsDataURL,
			isImage: isImage
		};
	};


	function getFileType(file) {
		var _validImageFileExtensions = [".jpg", ".jpeg", ".bmp", ".gif", ".png"];
	}

	/**
	 * File object definition:
	 * - name: Display name of the file.
	 * - type: File type, i.e. image/png, image/jpeg ...
	 * - size: Size of the file in bytes.
	 * - dataUrl: Filesystem URL of the file, readable by FileTransfer library.
	 * - data: Platform specific file data.
	 * - fileEntry: File handle, which can be used to remove the file later.
	 */

	function FileObject(name, type, size, dataUrl, data, fileEntry) {
		var self = this
			;
		self.name = name;
		self.displayName = name;
		self.type = type;
		self.size = size;
		self.dataUrl = dataUrl;
		self.data = data;
		self.fileEntry = fileEntry;
	}


})();