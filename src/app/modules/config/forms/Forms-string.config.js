/**
 * Created by sudhir on 9/10/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.config(['FormServiceProvider',
			FormServiceConfig])
	;

	function FormServiceConfig(FormServiceProvider) {

		var fieldTypeString =
			FormServiceProvider.defineField('String', {
				type: 'string',
				fieldData: {
					fieldModel: {
						type: 'input'
					},
					constraints: {
						label: {
							length: {
								minimum: 5, maximum: 100,
								tooShort: "should longer than %{count} characters.",
								tooLong: "Please limit the label length to %{count} characters."
							}
						},
						desc: {
							length: {
								minimum: 0, maximum: 255,
								tooShort: "should be at-least than %{count} characters.",
								tooLong: ": Please limit the field description to %{count} characters."
							}
						}
					}
				},
				tpl: {
					editor: "app/modules/form/templates/string-field/string-editor.partial.html",
					form: "app/modules/form/templates/string-field/string-form.partial.html",
					preview: "app/modules/form/templates/string-field/string-preview.partial.html"
				},
				editorConfig: {
					controller: ['EditorCtrl', 'mDialog', '$scope', '$timeout', 'Lang',
						function StringEditorController(EditorCtrl, Dialog, $scope, $timeout, Lang) {
							$scope.stringTypeModel = EditorCtrl.formField.validation.patterns.allowed[0] || null;
							$scope.editorCtrl = EditorCtrl;
							$scope.selectAndAddValidations = selectAndAddValidations;
							$scope.showValidationEditor = showValidationEditor;
							$scope.FIELD_LANG = Lang.en.data.FORM_FIELD;
							$scope.VALIDATION_LANG = Lang.en.data.VALIDATION;

							/**
							 * If presence is set to true, the length validation should be activated.
							 */
							$scope.$watch('editorCtrl.formField.validation.presence', function (newValue, oldValue) {
								/**
								 * Get available validation object if available
								 * Otherwise copy default validation constraint form field definition.
								 * @type {Object} Validation constraint object
								 */
								var lengthConstraint
									= EditorCtrl.formField.validation.length || angular.copy(EditorCtrl.fieldDef.validators.length);
								if (newValue === true) {
									if (!lengthConstraint.minimum || lengthConstraint.minimum <= 0) {
										lengthConstraint.minimum = 1
									}
									if (!lengthConstraint.maximum || lengthConstraint.maximum <= 0) {
										lengthConstraint.maximum = 200
									}
									EditorCtrl.addValidator('length', lengthConstraint);
								}
							});

							/*
							 TODO(Sudhir) Allow stacking of patterns
							 to allow field to run validations against multiple patterns.
							 */

							$scope.$watch('stringTypeModel', function (newValue, oldValue) {
								console.log($scope.editorCtrl.fieldModel);
								$scope.editorCtrl.formField.validation.patterns =
									$scope.editorCtrl.formField.validation.patterns || {
										allowed: []
									};
								if ($scope.stringTypeModel == 'none') {
									$scope.editorCtrl.formField.validation.patterns.allowed = [];
								} else {
									$scope.editorCtrl.formField.validation.patterns.allowed = [newValue]
								}
							});

							function showValidationEditor(type) {
								return EditorCtrl.showValidationEditor(type)
									.then(function (constraint) {
										var lengthMandatoryErr = validateMandatoryLengthConstraint(constraint);
										var lengthConstraintErr = validationLengthConstraint(constraint);
										if (EditorCtrl.formField.validation.presence == true) {
											if (lengthMandatoryErr) {
												Dialog.alert({
													title: "Invalid Validations",
													content: lengthMandatoryErr.errMsg,
													ok: "Ok"
												});
											} else if (lengthConstraintErr) {
												Dialog.alert({
													title: "Invalid Validations",
													content: lengthConstraintErr.errMsg,
													ok: "Ok"
												});
											} else {
												EditorCtrl.addValidator('length', constraint);
											}
										} else if (lengthConstraintErr) {
											Dialog.alert({
												title: "Invalid Validations",
												content: lengthConstraintErr.errMsg,
												ok: "Ok"
											});
										}
										else {
											EditorCtrl.addValidator('length', constraint);
										}
									});
							}

							function validateMandatoryLengthConstraint(constraint) {
								if (constraint.minimum == 0
									|| constraint.maximum == 0) {
									return {
										errMsg: "For Mandatory fields please select a minimum and maximum value"
									}
								}
							}

							function validationLengthConstraint(constraint) {
								if (constraint.minimum >= constraint.maximum) {
									return {
										errMsg: "Please set the minimum value less than the maximum value."
									}
								}
							}

							function selectAndAddValidations($event) {
								var validators = EditorCtrl.formField.getAvailableValidators(false);
								var selectOptions = [];
								if (validators.length) {
									selectOptions.push({
										text: "Length",
										value: 'length'
									});

									EditorCtrl.showValidationSelector(selectOptions, $event)
										.then(function (select) {
											EditorCtrl.showValidationEditor(select.value)
												.then(function (constraint) {
													if (EditorCtrl.formField.validation.presence == true) {
														if (constraint.minimum > 0
															&& constraint.maximum > 0) {

														} else {
															Dialog.alert({
																title: "Invalid Validations",
																content: "For Mandatory fields please select a minimum and maximum value",
																ok: "Ok"
															});
														}
													} else {
														EditorCtrl.addValidator('length', constraint);
													}
												});
										})
								}
							}

						}]
				},
				validationConfig: {
					presence: {
						hidden: true
					}
				},
				validators: {
					length: {
						minimum: null,
						maximum: 200
					},
					presence: false,
					patterns: {
						allowed: ['email', 'alpha-numeric']
					}
				}
			});


	}

})();