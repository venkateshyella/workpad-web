/**
 * Created by sudhir on 9/10/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.provider('FormService', [FormServiceProvider])
	;

	/**
	 * Provide field objects that are fed into
	 *  - FieldEditor, FormField and FormValue directives
	 *  which render the corresponding UI
	 *  and provide related functionality.
	 *
	 */
	function FormServiceProvider() {

		var _fieldRepo = {}
			, _validators = {}
			;

		/**
		 * TODO (Sudhir) Cleanup of un-used methods
		 */
		return {
			defineValidator: defineValidator,
			defineField: defineField,
			$get: ['mDialog', FormService]
		};

		function defineValidator(name, def) {
			_validators[name] = def;
		}

		/**
		 * Field definition
		 *
		 * - type: String
		 *    Unique ID that identifies the field.
		 *
		 * - tpl.editor: String
		 *    Template URL for the field editor
		 *
		 * - tpl.form: String
		 *    Template URL for the field in the actual form.
		 *
		 * - tpl.preview: String
		 *    Template URL for the field used to present the form data
		 *    to the user.
		 *
		 * - constraints: Array of enums
		 *    List of allowed (predefined) constraints that apply to this field.
		 *
		 * - options: Object
		 *    Options if any.
		 *
		 */

		function defineField(name, fieldDefinition) {
			_fieldRepo[name] = _prepDefinition(fieldDefinition);
			function _prepDefinition(definition) {
				// parse validators
				//angular.forEach(fieldDefinition.validators, function (validator) {
				//	if (!angular.isDefined(validator._isEnabled)) {
				//		validator._isEnabled = false;
				//	}
				//});

				return definition;
			}
		}

		function FormFieldFactory() {

			return {
				createField: createField
			};

			/**
			 * Create a new field of a given field type
			 * @param name String A name to identify the field.
			 * @param type String
			 * @param model Object Data Model of the form field
			 */
			function createField(type, model, options) {
				var fieldDefinition
					, newField
					;
				fieldDefinition = _.find(_fieldRepo, {type: type});
				if (!fieldDefinition) {
					console.error('field "' + type + '" was not found. Please define this field before using it');
				} else {
					//newField = new FormField(fieldDefinition, model, options);
					newField = DataProvider.resource.FormField.createInstance({
						keyType: type,
						validation: fieldDefinition.validators,
						templateOptions: {
							definition: fieldDefinition,
							fieldModel: model
						}
					});

				}
				return newField;
			}

			function FormField(definition, fieldModel, formModel, options) {
				var self = this
					, _options = options || {}
					;

				__constructor();

				function __constructor() {
					self.definition = angular.copy(definition);
					self.fieldModel = fieldModel || {};
					self.formValidations = self.definition.validators;
					self.getFormFieldError = getFormFieldError;
					self.getFieldError = getFieldError;
					self.getAvailableValidators = getAvailableValidators;
					self.toggleValidator = toggleValidator;
					self.toJSON = toJSON;
					self.getName = getName;

					if (self.fieldModel._fieldName) {
						self._fieldName = self.fieldModel._fieldName;
					} else {
						self.fieldModel._fieldName = self._fieldName || angular.isDefined(_options.name)
							? _options.name + Math.random().toString(36).substring(7)
							: Math.random().toString(36).substring(7)
						;
					}
					self.formModel = {};
				}

				function getName() {
					return self.fieldModel._fieldName
				}

				function toJSON() {
					return angular.copy({
						_fieldName: self._fieldName,
						definition: self.definition,
						fieldModel: self.fieldModel

					})
				}

				function toggleValidator(validator, enable) {
					var type = validator.type
						, updatedConstraint = validator.updatedConstraint
						;

					if (self.formValidations[type]) {
						if (angular.isDefined(enable)) {
							if (enable) {
								angular.extend(self.formValidations[type], updatedConstraint);
							}
							self.formValidations[type]._isEnabled = !!enable;
						}
						else {
							self.formValidations[type]._isEnabled = !self.formValidations[type]._isEnabled;
						}
					}
					return self;
				}

				function getAvailableValidators(isEnabled) {
					if (angular.isDefined(isEnabled)) {
						var res = {};
						_.forEach(self.formValidations, function (validator, key) {
							if (validator._isEnabled == isEnabled)
								res[key] = validator;
						});
						return res;
					} else {
						return self.formValidations;
					}
				}

				function getFieldError(fieldName) {
					var constraint = {};
					constraint[fieldName] = definition.fieldData.constraints[fieldName];
					return validate(self.fieldModel, constraint);
				}

				function getFormFieldError(fieldName) {
					var constraints = {};
					_.forEach(self.definition.validators, function (constraint, key) {
						if (constraint._isEnabled) {
							constraints[key] = constraint;
						}
					});
					var res = {};
					res[fieldName] = validate.single(self.formModel[fieldName], constraints);
					console.log(res);
					return res;
				}
			}

			FormField.prototype = Object.create(ValidatingFormField.prototype);

			function ValidatingFormField() {
				this.validateField = function validateField() {
					console.log('validating field data');
				}
			}
		}

		function FormService(Dialog) {
			var FieldFactory = new FormFieldFactory();
			return {
				createNewFormFieldInstance: createNewFormFieldInstance,

				/*
				TODO (Sudhir): Clean up unused API
				 */
				getAvailableFields: getAvailableFields,
				getFieldDefinition: getFieldDefinition,
				getFieldValidators: getFieldValidators,
			};

			/**
			 * Create a new field instance of a given field type
			 * @param name String A name to identify the field.
			 * @param type String
			 * @param model Object Data Model of the form field
			 */
			function createNewFormFieldInstance(type, model, options) {
				var fieldDefinition
					, newField
					, fieldModel = model || {}
					;
				fieldDefinition = _.find(_fieldRepo, {type: type});
				if (!fieldDefinition) {
					console.error('field "' + type + '" was not found. Please define this field before using it');
				} else {
					newField = DataProvider.resource.FormField.createInstance({
						keyType: type,
						validation: {},
						templateOptions: {
							definition: fieldDefinition,
							fieldModel: fieldModel
						}
					});

				}
				return newField;
			}

			function getFieldDefinition(fieldType) {
				return angular.copy(_.find(_fieldRepo, {type: fieldType}));
			}

			function getAvailableFields() {
				return angular.copy(_fieldRepo);
			}

			function getFieldValidators(fieldType) {
				var fieldDefinition = getFieldDefinition(fieldType);
				if (angular.isDefined(fieldDefinition)) {
					return angular.copy(fieldDefinition.validators)
				} else {
					console.error('Invalid field type: "' + fieldType + '"');
					return {}
				}
			}
		}
	}

})();