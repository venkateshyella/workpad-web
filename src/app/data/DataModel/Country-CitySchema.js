/**
 * Created by sudhir on 6/1/16.
 */

angular.module('DL')
	.service('COUNTRY', [
		'$q',
		function ($q) {

			return {
				config: {
					name: "Country",
					computed: {},
					methods: {},
					endpoint: "/country",
					relations: {},
					customEndpoint: {},
					respAdapter: {},
					reqAdapter: {}
				}
			}
		}
	])
	.service('CITY', [
		'$q',
		function ($q) {

			var resource;

			return {
				config: {
					name: "City",
					computed: {},
					methods: {},
					endpoint: "/city",
					relations: {},
					customEndpoint: {},
					respAdapter: {},
					reqAdapter: {}
				},
				initResource: function (res) {
					resource = res;
				},
				fuzzyFind: function (cityName, options) {
					"use strict";
					var self = this
						, deferred = $q.defer();
					var fuseOptions = {
						keys: ['countryName'],   // keys to search in
						threshold: 0.3,
						maxPatternLength: 20
					};
					resource.findAll({cityName: cityName}, {bypassCache: true})
						.then(function (results) {
							//var fuseFinder = new Fuse(resource.getAll(), fuseOptions);
							//return fuseFinder.search(cityName);
							deferred.resolve(results);
						})
						.catch(function (err) {
							deferred.reject(err);
						});

					return deferred.promise;
				}
			}
		}
	])
;