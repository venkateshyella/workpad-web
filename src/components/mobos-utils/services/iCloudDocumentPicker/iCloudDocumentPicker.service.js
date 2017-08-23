/**
 * Created by sudhir on 4/2/16.
 */

;(function () {
	"use strict";

	function iCloudDocumentPicker(FileObject, $q, $cordovaFile) {

		var defaultOptions = {
			PATH_END_NAME: "\/[^\/]+$",
			filePickerOptions: ["public.content", "public.image", "public.data", "public.audio"]
		};

		function pickFile(options) {
			var deferred = $q.defer()
				, _options = angular.extend({}, defaultOptions, options)
				;
			window.FilePicker.pickFile(
				function (res) {
					var fileNameMatch = res.match(_options.PATH_END_NAME);
					var fileName = "";
					if (angular.isArray(fileNameMatch) && fileNameMatch[0]) {
						fileName = fileNameMatch[0];
						if (fileName[0] == "/") {
							fileName = fileName.slice(1, fileName.length);
						}
					}
					var path = res
						, name = fileName || "NA"
						, type = null
						, size = null
						;
					console.log("res:", res);
					deferred.resolve(new FileObject(name, type, size, path, null));
				},
				function (err) {
					console.log("err: ", err);
					deferred.reject(err);
				}, _options.filePickerOptions);

			return deferred.promise;
		}

		function copyFileToAppSandbox(fileURI) {
			var deferred = $q.defer();

			return deferred.promise;
		}

		return {
			pickFile: pickFile
		}
	}

	iCloudDocumentPicker.$inject = ['FileObject', '$q', '$cordovaFile'];

	angular.module('FilePicker')
		.factory('iCloudDocumentPicker', iCloudDocumentPicker)
	;

})();