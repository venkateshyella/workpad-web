// WWHttpAdapter-factory.js

;
(function () {

	var DL = angular.module("DL");

	DL.factory('WWHttpAdapter', [
		"$q", "$timeout",
		"Connect",
		"URL",
		function WWHttpAdapter($q, $timeout, Connect, URL) {

			function prepFindReq(definition, id, options) {
				"use strict";
				if (angular.isFunction(definition.reqAdapter.find)) {
					return definition.reqAdapter.find(definition, id, options);
				} else return {
					id: id
				};
			}

			function parseFindResp(definition, resp, id, options) {
				if (angular.isFunction(definition.respAdapter.find)) {
					return definition.respAdapter.find(resp, id, options);
				} else if (angular.isFunction(definition.respAdapter.defaultAdapter)) {
					return definition.respAdapter.defaultAdapter(resp);
				} else return resp;
			}

			function prepFindAllReq(definition, resp, options) {
				if (angular.isFunction(definition.respAdapter.findAll)) {
					return definition.respAdapter.findAll(resp, options);
				} else if (angular.isFunction(definition.respAdapter.defaultAdapter)) {
					return definition.respAdapter.defaultAdapter(resp);
				} else return resp;
			}

			function parseFindAllResp(definition, resp, options) {
				if (angular.isFunction(definition.respAdapter.findAll)) {
					return definition.respAdapter.findAll(resp, options);
				}
				else if (angular.isFunction(definition.respAdapter.defaultAdapter)) {
					return definition.respAdapter.defaultAdapter(resp);
				}
				else if (resp.results) {
					return resp.results;
				}
				else return resp;
			}

			function parseUpdateResp(definition, resp, options) {
				if (angular.isFunction(definition.respAdapter.update)) {
					return definition.respAdapter.update(resp, options);
				} else if (angular.isFunction(definition.respAdapter.defaultAdapter)) {
					return definition.respAdapter.defaultAdapter(resp);
				} else return resp;
			}

			function parseUpdateAllResp(definition, resp, options) {
				if (angular.isFunction(definition.respAdapter.updateAll)) {
					return definition.respAdapter.findAll(resp, options);
				}
				else if (angular.isFunction(definition.respAdapter.defaultAdapter)) {
					return definition.respAdapter.defaultAdapter(resp);
				}
				else if (resp.results) {
					return resp.results;
				}
				else return resp;
			}

			function prepUpdateReq(definition, req) {
				if (angular.isFunction(definition.reqAdapter.update)) {
					return definition.reqAdapter.update(req);
				} else return req;
			}

			function prepCreateReq(definition, attrs, options) {
				if (angular.isFunction(definition.reqAdapter.create)) {
					return definition.reqAdapter.create(definition, attrs, options);
				}
				else return attrs;
			}

			function parseCreateResp(definition, resp, options) {
				"use strict";
				if (angular.isFunction(definition.respAdapter.create)) {
					return definition.respAdapter.create(resp, options);
				} else if (angular.isFunction(definition.respAdapter.defaultAdapter)) {
					return definition.respAdapter.defaultAdapter(resp);
				} else {
					return resp;
				}
			}

			function prepDeleteReq(definition, id, options) {
				"use strict";
				if (angular.isFunction(definition.reqAdapter.destroy)) {
					return definition.reqAdapter.destroy(definition, id, options);
				}
				else {
					var req = {};
					req[definition.idAttribute] = id;
					return req
				}
			}

			function parseDeleteResp(definition, resp, options) {
				"use strict";
				if (angular.isFunction(definition.respAdapter.destroy)) {
					return definition.respAdapter.find(resp, options);
				} else if (angular.isFunction(definition.respAdapter.defaultAdapter)) {
					return definition.respAdapter.defaultAdapter(resp);
				} else return resp;
			}

			function parseDestroyAllResp(definition, resp, options) {
				"use strict";
				if (angular.isFunction(definition.respAdapter.destroyAll)) {
					return definition.respAdapter.destroyAll(resp, options);
				}
				else if (angular.isFunction(definition.respAdapter.defaultAdapter)) {
					return definition.respAdapter.defaultAdapter(resp);
				}
				else if (resp.results) {
					return resp.results;
				}
				else return resp;
			}

			function wwHttpAdapter() {

				function _create(definition, attrs, options) {
					var _deferred = $q.defer();

					var req = prepCreateReq(definition, attrs, options);

					Connect.post(URL.BASE_URL + definition.endpoint + "/create.ws", req)
						.then(function onPostSuccess(result) {
							result.resp = parseCreateResp(definition, result.resp);
							_deferred.resolve(result.resp);
						}, function onCreateError(error) {
							"use strict";
							_deferred.reject(error);
						});

					return _deferred.promise;
				}

				function _find(definition, id, options) {
					var _deferred = $q.defer();
					var options = options || {};
					var req = prepFindReq(definition, id, options);
					var params = params || {},
						endpoint
						;
					if (definition.customEndpoint && definition.customEndpoint.find) {
						endpoint = URL.BASE_URL + definition.endpoint + definition.customEndpoint.find
					} else {
						endpoint = URL.BASE_URL + definition.endpoint + '/view.ws';
					}

					Connect.get(endpoint, req)
						.then(function onFindSuccess(result) {
								result.resp = parseFindResp(definition, result.resp, id, options);
								_deferred.resolve(result.resp);
							},
							function onFindError(error) {
								_deferred.reject(error);
							});

					return _deferred.promise;
				}

				/**
				 *
				 * @param definition Model schema. (auto injected)
				 * @param params HTTP GET query params
				 * @param options
				 * @returns {*}
				 * @private
				 */
				function _findAll(definition, params, options) {
					options = options || {};
					var _deferred = $q.defer();
					var params = params || {},
						endpoint;
					if (definition.customEndpoint && definition.customEndpoint.findAll) {
						endpoint = URL.BASE_URL + definition.endpoint + definition.customEndpoint.findAll
					} else {
						endpoint = URL.BASE_URL + definition.endpoint + '/list.ws';
					}
					// Overwrite custom endpoint with url provided in options.
					endpoint = options.url || endpoint;
					var dataArray = [];
					$timeout(function () {
						Connect.get(endpoint, params)
							.then(function onGetSuccess(result) {
								if(options && options.dataAdapter) {
									definition.result = options.dataAdapter(result);
								}
								definition.result = angular.copy(result);
								dataArray = parseFindAllResp(definition, result.resp);
								_deferred.notify(definition.result);
								_deferred.resolve(dataArray);
							}, function onGetError(error) {
								_deferred.reject(error);
							})

					}, 10);

					return _deferred.promise;
				}

				function _update(definition, id, attrs, options) {
					var _deferred = $q.defer();
					var req = prepUpdateReq(definition, attrs);
					Connect.post(URL.BASE_URL + definition.endpoint + "/update.ws", req)
						.then(function onUpdateSuccess(result) {
								result.resp = parseUpdateResp(definition, result.resp);

								_deferred.notify(result);
								_deferred.resolve(result.resp);
							},
							function onUpdateError(error) {
								_deferred.reject(error);
							});

					return _deferred.promise;
				}

				function _updateAll(definition, attrs, options, Resource) {
					options = options || {};
					var _deferred = $q.defer();
					var endpoint
						, _attrs = attrs
						;
					if (definition.customEndpoint && definition.customEndpoint.findAll) {
						endpoint = URL.BASE_URL + definition.endpoint + definition.customEndpoint.findAll
					} else {
						endpoint = URL.BASE_URL + definition.endpoint + '/list.ws';
					}
					// Overwrite custom endpoint with url provided in options.
					endpoint = options.url || endpoint;
					var dataArray = [];
					Connect.post(endpoint, _attrs)
						.then(function onGetSuccess(result) {
							definition.result = angular.copy(result);
							dataArray = parseUpdateAllResp(definition, result.resp);
							_deferred.notify(definition.result);
							_deferred.resolve(dataArray);
						}, function onGetError(error) {
							_deferred.reject(error);
						})
					return _deferred.promise;
				}

				function _destroy(definition, id, options) {
					var _deferred = $q.defer();

					var options = options || {};
					var req = prepDeleteReq(definition, id, options);
					var params = params || {},
						endpoint
						;
					if (definition.customEndpoint && definition.customEndpoint.destroy) {
						endpoint = URL.BASE_URL + definition.endpoint + definition.customEndpoint.destroy
					}
					else {
						endpoint = URL.BASE_URL + definition.endpoint + '/delete.ws';
					}

					Connect.post(endpoint, req)
						.then(function onDeleteSuccess(result) {
								var resp;
								resp = parseDeleteResp(definition, result, options);
								_deferred.notify(resp);
								_deferred.resolve(resp);
							},
							function onDeleteError(error) {
								_deferred.reject(error);
							});

					return _deferred.promise;
				}

				function _destroyAll(definition, JSData_params, options) {
					options = options || {};
					var _deferred = $q.defer();
					var reqParams = options.params || JSData_params
						, endpoint;
					if (definition.customEndpoint && definition.customEndpoint.destroyAll) {
						endpoint = URL.BASE_URL + definition.endpoint + definition.customEndpoint.destroyAll
					} else {
						endpoint = URL.BASE_URL + definition.endpoint + '/destroyAll.ws';
					}
					// Overwrite custom endpoint with url provided in options.
					endpoint = options.url || endpoint;
					var dataArray = [];
					$timeout(function () {
						Connect.post(endpoint, reqParams)
							.then(function onGetSuccess(result) {
								definition.result = angular.copy(result);
								dataArray = parseDestroyAllResp(definition, result.resp);
								_deferred.notify(result);
								_deferred.resolve(_.pluck(dataArray, 'fileName'));
							}, function onGetError(error) {
								_deferred.reject(error);
							})

					}, 10);

					return _deferred.promise;
				}

				this.create = _create;
				this.find = _find;
				this.findAll = _findAll;
				this.update = _update;
				this.updateAll = _updateAll;
				this.destroy = _destroy;
				this.destroyAll = _destroyAll;
			}

			return wwHttpAdapter;

		}])

})();
