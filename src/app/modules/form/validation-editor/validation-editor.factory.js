/**
 * Created by sudhir on 13/10/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.provider('ValidationEditor', ValidationEditorProvider)
	;

	function ValidationEditorProvider() {

		var _validationOptions = {};

		return {
			defineValidationEditor: defineValidationEditor,
			$get: ['$q', 'mDialog', ValidationEditor]
		};

		function defineValidationEditor(name, dialogOptions, options) {

			_validationOptions[name] = _prepareValidationEditor(name, dialogOptions, options);

			function _prepareValidationEditor(name, dialogOptions, options) {
				return {
					name: name,
					dialogOptions: dialogOptions,
					options: options
				};
			}
		}

		function ValidationEditor($q, Dialog) {

			return {
				editConstraint: editConstraint,
				toJSON: toJSON
			};

			function editConstraint(name, constraint) {
				var deferred = $q.defer()
					, savedValidationEditor = _validationOptions[name]
					, dialogOptions = {}
					, _constraint = constraint || {}
					;
				if (angular.isDefined(savedValidationEditor)) {
					dialogOptions = savedValidationEditor.dialogOptions;
					dialogOptions.locals = dialogOptions.locals || {};
					dialogOptions.locals.constraint = angular.copy(constraint);
					Dialog.show(dialogOptions)
						.then(function (updatedConstraint) {
							deferred.resolve(updatedConstraint);
						})
						.catch(function (res) {
							deferred.resolve(constraint);
						})
					;
				} else {
					deferred.reject();
				}
				return deferred.promise;
			}

			function toJSON(name, constraint, options) {
				if (_validationOptions[name]
					&& _validationOptions[name].options
					&& angular.isFunction(_validationOptions[name].options.toJSON)) {
					return _validationOptions[name].options.toJSON(constraint, options);
				} else {
					return constraint;
				}
			}
		}

	}

})();