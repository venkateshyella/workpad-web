/**
 * Created by sudhir on 13/10/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.config(['ValidationEditorProvider', ValidationEditorConfig]);

	function ValidationEditorConfig(ValidationEditorProvider) {

		ValidationEditorProvider.defineValidationEditor('length', {
			templateUrl: 'app/modules/form/validation-editor/length-validation-editor.dialog.tpl.html',
			controller: ['$scope', '$mdDialog', 'constraint', function ($scope, $mdDialog, constraint) {
				$scope.form = {};
				$scope.cancel = $mdDialog.cancel;
				$scope.validationModel = constraint || {};

				$scope.saveValidationModel = function saveValidationModel() {
					$mdDialog.hide({
						minimum: $scope.validationModel.minimum,
						maximum: $scope.validationModel.maximum
					});
				}
			}]
		}, {
			toJSON: function (constraint, option) {
				var serverConstraints = {}
					, minVal = constraint.minimum || constraint.min
					, maxVal = constraint.maximum || constraint.max
					;
				minVal && (serverConstraints.min = minVal);
				maxVal && (serverConstraints.max = maxVal);
				return serverConstraints
			}
		});

		ValidationEditorProvider.defineValidationEditor('datetime', {
			templateUrl: 'app/modules/form/validation-editor/datetime-validation-editor.dialog.tpl.html',
			controller: ['$scope', '$mdDialog', 'constraint', function ($scope, $mdDialog, constraint) {
				$scope.form = {};
				$scope.cancel = $mdDialog.cancel;
				$scope.validationModel = constraint;


				if(!$scope.validationModel){
					$scope.validationModel = {};
					$scope.validationModel.earliest = new Date();
					$scope.validationModel.latest = new Date();

				}
				else{
					$scope.validationModel.earliest = new Date($scope.validationModel.earliest);
					$scope.validationModel.latest = new Date($scope.validationModel.latest);
				}

				$scope.formSubmissionEnable = true;
				$scope.dateErrorMsg = false;

				$scope.checkForValiddate = function checkForValiddate() {

					if ($scope.validationModel.latest < $scope.validationModel.earliest) {
						$scope.dateErrorMsg = true;
					} else {
						$scope.dateErrorMsg = false;
					}
				}

				$scope.saveValidationModel = function saveValidationModel() {

					$scope.validationModel.earliest = ($scope.validationModel.earliest);
					$scope.validationModel.latest = ($scope.validationModel.latest);

					$mdDialog.hide($scope.validationModel);

				}
			}]
		});

		ValidationEditorProvider.defineValidationEditor('numericality', {
			templateUrl: 'app/modules/form/validation-editor/numericality-validation-editor.dialog.tpl.html',
			controller: ['$scope', '$mdDialog', 'constraint', function ($scope, $mdDialog, constraint) {
				$scope.form = {};
				$scope.cancel = $mdDialog.cancel;
				$scope.validationModel = constraint || {};

				$scope.saveValidationModel = function saveValidationModel() {
					$mdDialog.hide($scope.validationModel);
				}
			}]
		});
	}
})();
