/**
 * Created by sudhir on 2/11/15.
 */

/**
 ref: "http://validatejs.org/"
 */

/**
 * Patterns validator definition.
 *
 * Used to validate a string field with a collection of allowed string patterns.
 * The field is considered valid only if it conforms to all the string patterns.
 *
 * Each pattern is behaves essentially like a Regex.
 *
 * Usage:
 *  patterns: {
 *    allowed: ['email', 'alpha-numeric']
 *  }
 * The constraint definition above passes for string fields
 * that are emails and contain only alpha-numeric characters.
 */

;
(function () {
	"use strict";
	var VALIDATION_REGEX = {
			/**
			 * Simple Email validator.
			 * @name "email"
			 *
			 * Sample: 'sample@email.id'
			 */
			email: /^[_A-Za-z0-9-]+(\.[_A-Za-z0-9-]+)*@[A-Za-z0-9]+(\.[A-Za-z]{2,})$/,
			/**
			 * Alpha numeric validator.
			 * Allows only alphabets and numbers.
			 * @name "alpha-numeric"
			 */
			'alpha-numeric': /^[a-zA-Z0-9]*$/
		}
		;

	angular.module('app')
		.config([function PatternValidatorConfig() {
			validate.validators.patterns = function (value, options, key, attributes) {

				var allowedPatterns = options.allowed || []
					, failValidations = []
					;

				for (var i = 0; i < allowedPatterns.length; i++) {
					var patternName = allowedPatterns[i]
						, patternRegex = VALIDATION_REGEX[patternName]
						;
					if (patternRegex) {
						var testResult = patternRegex.test(value);
						if (!testResult) {
							failValidations.push("not an " + patternName + ".")
						}
					} else {
						//return "Unknown pattern \"" + patternName + "\"";
					}
				}
				if (failValidations.length > 0) {
					return failValidations
				} else return null;

				//console.log(value);
				//console.log(options);
				//console.log(key);
				//console.log(attributes);
			};
		}])

		.config([function RequiredValidator() {
			validate.validators.required = function (value, options, key, attributes) {
				switch ((typeof value).toLocaleLowerCase()) {
					case "string":
						if (value.length == 0) {
							return "Please provide a value."
						}
						break;

					case "integer":
						if(!value) {
							return "Please provide a value."
						}
						break;

					default:
						if(!value) {
							return "Please provide a value."
						}
				}
			};
		}]);

})();