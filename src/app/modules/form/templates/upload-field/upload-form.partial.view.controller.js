/**
 * Created by sudhir on 8/10/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.controller('UploadFormPartialViewController', ['$scope', '$stateParams',
			'DataProvider', 'FileSystem', 'FileService', 'Session',
			UploadFormPartialViewController
		]);

	function UploadFormPartialViewController($scope, $stateParams, DataProvider, FileSystem, FileService, Session) {

		$scope.invokeFileChooserForUpload = invokeFileChooserForUpload;
		$scope.uploadedFileName = false;
		$scope.removeUploadedFile = removeUploadedFile;
		$scope.downloadFile = downloadFile;


		function removeUploadedFile() {
			$scope.formField.keyValue = null;
			$scope.uploadedFileName = false;
			$scope.uploadedImageUrl = null;
		}

		function downloadFile() {
			var url = URL.FORM_FILE_DOWNLOAD + '?' + $.param({id: 443}),
				target = '_system';

			$scope.uploadedImageUrl = url;
			// var ref = window.open(url, target);
		}

		function invokeFileChooserForUpload() {

			var formId = $scope.formField.formId;
			var formModel = DataProvider.resource.Form.get(formId);

			if ($scope.inProgress) return;
			$scope.uploadDone = false;
			$scope.error = null;

			FileSystem.pickFile()
				.then(function (file) {

					FileService.queueForUpload(file.name, file.dataUrl, URL.FORM_FILE_UPLOAD, {
						// var form = DataProvider.resource.Form.get();
						params: {
							fileTitle: file.displayName,
							catId: $scope.formField.formId,
							catType: -9,
							userSessionId: Session.id
						},
						tagName: "formVaultFileUpload",
						blockUI: true,
						fileObject: file,
						fileKey: 'file'
					})
						.then(function (res) {
							console.log(res);
							$scope.uploadedFileName = res.resp.fileName;
							$scope.formField.keyValue = {
								id: res.resp.id,
								filename: res.resp.fileName,
								uploadedImgUrl: URL.FORM_FILE_DOWNLOAD + '?' + $.param({id: res.resp.id})
							}
							$scope.uploadedImageUrl = URL.FORM_FILE_DOWNLOAD + '?' + $.param({id: res.resp.id});
						});

				})
				.catch(function (reject) {
					console.log(reject);
				})

		}
	}

})();
