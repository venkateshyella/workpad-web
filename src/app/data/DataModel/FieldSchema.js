/**
 * Created by sudhir on 6/10/15.
 */

;
(function () {
	"use strict";
	var DL = angular.module("DL");

	DL.service('FORM_FIELD', [
		'FormService', 'ValidationEditor', 'JOB_LIFECYCLE_EVENT',
		function FormFieldSchema(FormService, ValidationEditor, JOB_LIFECYCLE_EVENT) {

			var meta = {
					filters: {
						server: ['keyName', 'keyType', 'keyValue'],
						submit: ['keyName', 'keyType', 'keyValue', 'templateOptions'],
						default: ['keyName', 'keyType', 'keyValue', 'templateOptions', 'templateId']
					}
				}
				, modelDefinition = {
					config: {
						name: "FormField",
						idAttribute: 'keyName',
						defaultValues: {
							//keyName: null, // Unique string hash
							keyType: null, // enum <string, integer>
							keyValue: null, // Actual form model
							validation: [], // Available Validations

							templateOptions: {
								definition: {},
								fieldModel: {
									label: "",
									desc: null
								}
							}
						},
						beforeCreateInstance: function (resource, attrs) {
							console.log('FieldSchema.beforeCreateInstance');
							var fieldType = attrs.keyType;
							attrs.keyName = Math.random().toString(36).substring(7);
							attrs.templateOptions = attrs.templateOptions || {};
							attrs.templateOptions.fieldModel =
								attrs.templateOptions.fieldModel || {};
						},
						afterCreateInstance: function (resource) {
							resource.defaultValues.templateOptions = {
								definition: {},
								fieldModel: {}
							};
						},
						meta: meta,
						computed: {
							definition: ['keyType', function (keyType) {
								return FormService.getFieldDefinition(keyType)
							}],
							__prepData: ['keyType', 'validation', function (keyType, validation) {
								switch (keyType) {
									case 'string':
										if (!validation.length) return;
										var minVal = validation.length.min || validation.length.minimum;
										var maxVal = validation.length.max || validation.length.maximum;
										validation.length.minimum = minVal;
										validation.length.maximum = maxVal;
										delete validation.length.min;
										delete validation.length.max;
										break;
								}
							}]
						},
						methods: {
							toJSON: function (options) {
								var _options = options || {}
									, self = this
									, _filter
									, json
									;

								switch (_options.filter) {
									case 'server':
										json = angular.copy(_.pick(self, resource.meta.filters[options.filter]));
										json.templateOptions = {
											fieldModel: angular.copy(self.templateOptions.fieldModel)
										};
										json.validation = angular.copy(self.validation);
										//angular.forEach(validations, function(validation, key) {
										//	console.log(ValidationEditor.toJSON(key, validation));
										//});
										break;
									case 'submit':
										json = angular.copy(_.pick(self, resource.meta.filters[options.filter]));
										json.validation = {};
										var availableValidations = angular.copy(self.validation);
										angular.forEach(availableValidations, function (validation, key) {
											json.validation[key] = ValidationEditor.toJSON(key, validation)
										});
										if (angular.isDefined(json.validation.presence)) {
											json.validation.required = json.validation.presence;
											delete(json.validation.presence);
										}
										break;
									default:
										json = angular.copy(_.pick(self, resource.meta.filters.default));
										json.validation = angular.copy(self.getAvailableValidators(true));
								}

								return json;
							},
							getFormError: function () {
								var self = this
									, constraints = {}
									, error = {}
									, res
									;
								_.forEach(self.validation, function (constraint, key) {
									constraints[key] = constraint;
								});
								error = validate.single(self.keyValue, constraints);
								console.log(error);
								return error;
							},
							getFieldError: function (fieldName) {
								var self = this;
								var constraint = {};
								constraint[fieldName] = self.definition.fieldData.constraints[fieldName];
								return validate(self.templateOptions.fieldModel, constraint);
							},
							getAvailableValidators: function (isEnabled) {
								var self = this
									, _isEnabled = isEnabled || false
									;

								if (angular.isDefined(_isEnabled)) {
									var res = {};
									//_.forEach(self.validation, function (validator, key) {
									//	if (validator._isEnabled == isEnabled)
									//		res[key] = validator;
									//});

									if (_isEnabled) {
										res = self.validation;
									} else {
										var fieldValidatorList = FormService.getFieldValidators(self.keyType);
										angular.forEach(fieldValidatorList, function (validator, name) {
											if (!self.validation[name]) {
												res[name] = validator;
											}
										})
									}
									return res;
								} else {
									// Return all the available validators for this field type.
									return FormService.getFieldValidators(self.keyType);
								}
							},
							toggleValidator: function (validator, enable) {
								var self = this;
								var type = validator.type
									, updatedConstraint = validator.updatedConstraint
									;

								enable
									? self.validation[type] = updatedConstraint
									: delete(self.validation[type])
								;
								return self;
							}
						},
						endpoint: "??",
						customEndpoint: {},
						respAdapter: {},
						reqAdapter: {}
					}
				}
				, resource = null
				;

			return {
				config: modelDefinition.config,
				initResource: function (newResource) {
					resource = newResource;
				}
			};
		}
	])

})();