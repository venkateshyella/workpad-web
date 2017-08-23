/**
 * Created by sudhir on 23/10/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.controller('FormViewController', [
			'$scope', '$controller', '$stateParams', 'State',
			'mDialog', '$mdToast', 'blockUI',
			'DataProvider', FormViewController
		]);

	function FormViewController($scope, $controller, $stateParams, State
		, Dialog, $mdToast, blockUI, DataProvider) {

		var self = this
			, formId = $stateParams.formId
			, formModel = DataProvider.resource.Form.get(formId)
			;

		angular.extend(self, $controller('ViewDataBaseController', {
			$scope: $scope
		}));
		self.formFinder
			= self.initializeViewDataBaseController('formLoader', fetchFormModel,
			function findJobForms() {
				DataProvider.resource.Form.get(formId)
			});

		$scope.formModel = formModel;
		$scope.refresh = refresh;
		$scope.askAndDeleteForm = askAndDdeleteForm;

		refresh()
			.then(function () {
				$scope.formModel = formModel = DataProvider.resource.Form.get(formId);
			});

		function fetchFormModel() {
			return DataProvider.resource.Form.find(formId, {bypassCache: true})
		}

		function askAndDdeleteForm(formId) {

			var confirmConirmText = formModel._formType == 'JOB_FORM'
				? 'Do you wish to delete this form from "'+ formModel.job.title+'"'
				: 'Do you wish to delete this form from "'+ formModel.task.title+'"';


			Dialog.confirm({
				title: "Delete Form",
				content: confirmConirmText,
				ok: $scope.LANG.BUTTON.DELETE,
				cancel: $scope.LANG.BUTTON.CANCEL
			})
				.then(function () {
					blockUI.start("Deleting Form");
					_sendDeleteRequest(formId)
						.then(function (res) {
							State.transitionBack();
							blockUI.stop();
						})
						.catch(function (err) {
							blockUI.stop(err.respMsg, {
								status: "isError",
								action: 'Ok'
							})
						});
				})
			;

			function _sendDeleteRequest(formId) {
				return DataProvider.resource.Form.destroy();
			}
		}

		function refresh() {
			return $scope.formLoader.refresh();
		}
	}

})();