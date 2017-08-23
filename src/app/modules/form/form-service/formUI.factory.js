/**
 * Created by sudhir on 8/10/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.directive('fieldEditor', ['$compile', '$templateCache', '$http',
			'mDialog', 'ValidationEditor', '$injector',
			'Lang',
			FieldEditorDirective])
		.directive('field', ['$compile', '$timeout', 'AppCoreUtilityServices',
			FieldDirective])
		.directive('fieldPreview', ['$compile', '$http',
			'AppCoreUtilityServices',
			FieldPreview])
	;

	/**
	 * FieldEditorDirective
	 */
	function FieldEditorDirective($compile, $templateCache, $http
		, Dialog, ValidationEditor, $injector
		, Lang) {

		var getTemplate = function (url) {
				var templateLoader
					;
				var templateUrl = url;
				templateLoader = $http.get(templateUrl, {cache: $templateCache});

				return templateLoader;
			}
			, LANG = Lang.en.data
			;

		return {
			restrict: 'E',
			require: '^form',
			scope: {
				formField: '=',
				formValidations: '='
			},
			link: {
				pre: preLink,
				post: postLink
			},
			controller: ['$scope', FieldEditorController]
		};

		function preLink(scope, elem, attrs, FormController) {
		}

		function postLink(scope, elem, attrs, $controller) {
			var editorScope = null;

			//scope.formCtrl = FormController;
			scope.fieldDef = scope.formField.definition;
			scope.fieldModel = scope.formField.templateOptions.fieldModel || {};
			scope.formValidations = scope.formField.templateOptions.validation;
			scope.fieldCtrl = scope.fieldCtrl || {};
			scope.fieldCtrl.formField = scope.formField,
				scope.fieldCtrl.fieldDef = scope.formField.definition,
				scope.fieldCtrl.fieldModel = scope.formField.templateOptions.fieldModel || {},
				scope.fieldCtrl.formValidations = scope.formField.templateOptions.validation;
			scope.fieldCtrl.$error = {};
			scope.fieldCtrl.showValidationSelector = showValidationSelector;
			//scope.fieldCtrl = {
			//	formField: scope.formField,
			//	fieldDef: scope.formField.definition,
			//	fieldModel: scope.formField.templateOptions.fieldModel || {},
			//	formValidations: scope.formField.templateOptions.validation,
			//
			//	onFieldChange: onFieldChange,
			//	getError: getError,
			//	$error: {},
			//addValidator: addValidator,
			//selectAndAddValidator: selectAndAddValidator,
			//showValidationSelector: showValidationSelector,
			//showValidationEditor: showValidationEditor,
			//removeValidator: removeValidator,
			//isValidationEnabled: isValidationEnabled
			//};
			var EditorCtrl = scope.fieldCtrl;

			/**
			 * Bind custom controller to a new child scope
			 * if the controller is defined in the field definition.
			 */
			if (scope.fieldDef.editorConfig && scope.fieldDef.editorConfig.controller) {
				editorScope = scope.$new();
				var res = $injector.invoke(scope.fieldDef.editorConfig.controller, this, {
					$scope: editorScope,
					EditorCtrl: EditorCtrl
				});
			} else {
				editorScope = scope;
			}

			getTemplate(scope.formField.definition.tpl.editor)
				.then(function (fieldTemplate) {
					var editorTemplateString = fieldTemplate.data;
					elem.append($compile(editorTemplateString)(editorScope))
				})
			;

			function isValidationEnabled(name) {
				return !!scope.formField.validation[name];
			}

			function selectAndAddValidator($event) {
				// get disabled validators list
				var validators = scope.formField.getAvailableValidators(false);
				// show selector
				var selectOptions = []
					, validatorName = null
					;
				_.forEach(validators, function (validator, key) {
					validatorName = LANG.VALIDATION_EDITOR[key]
						? LANG.VALIDATION_EDITOR[key].NAME
						: key;
					selectOptions.push({
						text: validatorName,
						value: key
					});
				});

				// If no unused validators found, do nothing.
				if (selectOptions.length == 0) {
					return;
				}
				showValidationSelector(selectOptions, $event)
					.then(function (select) {
						//console.log(select);
						var constraintType = select.value;
						showValidationEditor(constraintType)
							.then(function (constraint) {
								addValidator(constraintType, constraint);
								return constraint;
							});
					})
				;
			}

			function showValidationSelector(selectOptions, $event) {
				return Dialog.showListDialog(selectOptions, {
					$event: $event
				})
			}

			function showValidationEditor(type, saveChanges) {
				var validationConstraint = scope.formField.getAvailableValidators(true)[type];
				return ValidationEditor.editConstraint(type, validationConstraint)
					.then(function (updatedConstraint) {
						if (saveChanges) {
							addValidator(type, updatedConstraint);
						}
						return updatedConstraint;
					})
					;
			}

			function addValidator(type, constraint) {
				return scope.formField.toggleValidator({
					type: type,
					updatedConstraint: constraint
				}, true);
			}

			function removeValidator(name) {
				return scope.formField.toggleValidator({type: name}, false)
			}

			function getError(fieldName) {
				var vres = scope.formField.getFieldError(fieldName);
				if (vres) {
					// error found
					scope.fieldCtrl.$error[fieldName] = vres[fieldName];
				} else {
					scope.fieldCtrl.$error[fieldName] = null
				}
				return vres;
			}

			function onFieldChange(fieldName) {
				console.log(fieldName)
			}

		}

		function FieldEditorController($scope) {
			$scope.fieldCtrl = {
				onFieldChange: onFieldChange,
				getError: getError,
				$error: {},
				selectAndAddValidator: selectAndAddValidator,
				showValidationEditor: showValidationEditor,
				removeValidator: removeValidator,
				addValidator: addValidator,
				isValidationEnabled: isValidationEnabled
			};

			function isValidationEnabled(name) {
				return !!$scope.formField.validation[name];
			}

			function selectAndAddValidator($event) {
				// get disabled validators list
				var validators = $scope.formField.getAvailableValidators(false);
				// show selector
				var selectOptions = []
					, validatorName = null
					;
				_.forEach(validators, function (validator, key) {
					validatorName = LANG.VALIDATION_EDITOR[key]
						? LANG.VALIDATION_EDITOR[key].NAME
						: key;
					selectOptions.push({
						text: validatorName,
						value: key
					});
				});
				// If no unused validators found, do nothing.
				if (selectOptions.length == 0) {
					return;
				}

				Dialog.showListDialog(selectOptions, {
					$event: $event
				})
					.then(function (select) {
						console.log(select);
						showValidationEditor(select.value);
					})
				;
			}

			function showValidationEditor(type, saveChanges) {
				var validationConstraint = $scope.formField.getAvailableValidators(true)[type];
				return ValidationEditor.editConstraint(type, validationConstraint)
					.then(function (updatedConstraint) {
						if (saveChanges) {
							addValidator(type, updatedConstraint);
						}
						return updatedConstraint;
					})
					;
			}

			function addValidator(type, constraint) {
				return $scope.formField.toggleValidator({
					type: type,
					updatedConstraint: constraint
				}, true);
			}

			function removeValidator(name) {
				return $scope.formField.toggleValidator({type: name}, false)
			}

			function getError(fieldName) {
				var vres = $scope.formField.getFieldError(fieldName);
				if (vres) {
					// error found
					$scope.fieldCtrl.$error[fieldName] = vres[fieldName];
				} else {
					$scope.fieldCtrl.$error[fieldName] = null
				}
				return vres;
			}

			function onFieldChange(fieldName) {
				console.log(fieldName)
			}
		}
	}

	/**
	 * FieldDirective
	 * Renders the field in a form and implements all the
	 * available field validations.
	 */
	function FieldDirective($compile, $timeout, AppCoreUtilityServices) {
		return {
			restrict: 'E',
			require: '?ngModel',
			scope: {
				formField: '=',
				isFieldDisabled: "=isDisabled"
			},
			link: {
				pre: preLink,
				post: postLink
			},
			controller: ['$scope', FieldController]
		};

		function preLink(scope, elem, attrs, ngModelController) {

		}

		function postLink(scope, elem, attrs, ngModelController) {
			scope.fieldModel = scope.formField.templateOptions.fieldModel;

			AppCoreUtilityServices.getTemplate(scope.formField.definition.tpl.form)
				.then(function (resp) {
					elem.append($compile(resp.data)(scope))
				})
			;

			scope.fieldCtrl = {
				isDisabled: isDisabled,
				getFormFieldError: validateFormField,
				$formError: null
			};

			function isDisabled() {
				return !!scope.isFieldDisabled;
			}

			function validateFormField() {
				if (scope.isFieldDisabled) {
					return null;
				}
				var formError = scope.formField.getFormError()
					, isValid;
				//console.log(formError);
				if (formError) {
					scope.fieldCtrl.$formError = formError;
					ngModelController &&
					ngModelController.$setValidity(scope.formField.keyName, false);
				} else {
					scope.fieldCtrl.$formError = null;
					ngModelController &&
					ngModelController.$setValidity(scope.formField.keyName, true);
				}
			}

		}

		function FieldController($scope) {
			var formField = $scope.formField;
		}
	}

	/**
	 * FieldPreview
	 */
	function FieldPreview($compile, $http, AppCoreUtilityServices) {
		var defaultPreviewTemplate = "app/modules/form/templates/field-preview-default.tpl.html";
		return {
			restrict: 'E',
			scope: {
				field: '='
			},
			link: {
				pre: preLink,
				post: postLink
			}
		};

		function preLink(scope, elem, attrs) {
		}

		function postLink(scope, elem, attrs) {
			var fieldPreviewTemplate = scope.field.definition.tpl.preview || defaultPreviewTemplate;
			var field = scope.field;
			scope.fieldModel = field.templateOptions.fieldModel || {};
			AppCoreUtilityServices.getTemplate(fieldPreviewTemplate)
				.then(function (resp) {
					elem.append($compile(resp.data)(scope))
				})
			;
		}
	}

})();