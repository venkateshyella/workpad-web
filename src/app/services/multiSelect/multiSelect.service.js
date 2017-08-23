/**
 * Created by sudhir on 12/1/16.
 */

angular.module('ng.appUiProvider.multiSelectService', [])
	.factory('MultiSelectDialog', ['$q', 'mDialog', function ($q, Dialog) {

		var defaultConfig = {
			template: ""
		};
		return {
			show: function (multiSelectConfig) {
				"use strict";
				var config = angular.extend({}, multiSelectConfig)
					, deferred = $q.defer();

				Dialog.show(config)
					.then(function(res) {
						deferred.resolve(res);
					})
					.catch(function (err) {
						deferred.reject(err);
					});
				return deferred.promise;
			}
		}
	}])
;