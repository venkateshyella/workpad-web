/**
 * Created by sudhir on 16/4/15.
 */

;
(function () {

	angular.module('mobos.utils')
		.provider('Lang', LangProvider);

	function LangProvider() {

		var languages = {},
			defaults = {
				langName: null
			};

		function LangFactory($http, $q, $timeout) {

			var self = {};

			self.loadLanguage = loadLanguage;
			self.loadAllLanguages = loadAllLanguages;

			angular.forEach(languages, function (langName) {
				self[langName.name] = langName;
			});
			self['data'] = languages[defaults.langName].data;
			return self;

			function loadLanguage(name) {
				var deferred = $q.defer();
				if (languages[name]) {
					$http
						.get(languages[name].uri)
						.then(function onLangLoadSucces(result) {
							angular.extend(languages[name].data, result.data);
							deferred.resolve(result);
						}, function onLangLoadError(error) {
							deferred.reject(error);
						})
				} else {
					console.warn('Language `' +
						name +
						'` is not available. Please add the language definition in the app config');
					deferred.reject();
					//throw "NO_LANGUAGES_DEFINED";
				}
				return deferred.promise;
			}

			function loadAllLanguages() {
				langfetchPromiseBucket = [];
				angular.forEach(languages, function (lang) {
					langfetchPromiseBucket.push(
						$q.when(loadLanguage(lang.name)));
				});
				return $q.all(langfetchPromiseBucket);
			}
		}

		var provider = {
			setDefaultLang: function (langName) {
				"use strict";
				defaults.langName = langName;
			},
			defineNewLanguage: function (langName, langUri, defaults) {
				languages[langName] = {
					name: langName,
					uri: langUri,
					data: defaults || {}
				};
				return provider;
			},
			$get: ['$http', '$q', '$timeout', LangFactory]
		};
		return provider;

	}

	LangProvider.$inject = [];
})();
