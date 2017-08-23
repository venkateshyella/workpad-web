/**
 * Created by sudhir on 15/3/16.
 */

;(function () {
	"use strict";

	function ImageEditorFactory($q, Dialog, blockUI) {

		function ImageEditor(uploadFn, oldImageUrl) {
			var self = this;
			self.uploadFn = uploadFn;
			self.oldImageUrl = oldImageUrl;
			self.localImageUri = null;
		}

		ImageEditor.prototype.showImageUploadConfirmation = function () {
			var self = this;
			return Dialog.show({
					templateUrl: 'app/modules/workflow/imageEditor/image-editor.dialog.tpl.html',
					controller: ['$scope', 'locals', '$mdDialog', function ($scope, locals, $mdDialog) {
						angular.extend($scope, {
							status: {},
							locals: locals,
							startUpload: startUpload,
							cancel: $mdDialog.cancel
						});

						$scope.img = locals.localImageUri;

						function startUpload() {
							$scope.error = null;
							$scope.status.inProgress = true;
							blockUI.start('Updating Image', {
								status: 'isLoading'
							});
							locals.uploadFn(locals.localImageUri)
								.then(function (res) {
									blockUI.stop();
									$mdDialog.hide(res);
								}, null, function (progressEvent) {

								})
								.catch(function (err) {
									$scope.error = err;
									blockUI.stop(err.respMsg, {
										status: 'isError',
										action: 'Ok'
									})
								})
								.finally(function () {
									$scope.status.inProgress = false;
								})
						}

					}],
					locals: self
				})
				.then(function () {
					return self.localImageUri;
				})
		};

		ImageEditor.prototype.hideImageUploadConfirmation = function () {

		};

		ImageEditor.prototype.startUpload = function () {
			return this.uploadFn(this.localImageUri);
		};

		ImageEditor.prototype.cancelUpload = function () {

		};

		return {
			Factory: ImageEditor
		};
	}

	ImageEditorFactory.$inject = ['$q', 'mDialog', 'blockUI'];

	angular.module('app.workflow.imageEditor', ['ngMaterial'])
		.factory('ImageEditorFactory', ImageEditorFactory)
	;

})
();