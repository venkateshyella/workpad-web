// DataProvider.js

(function () {

	var DL = angular.module("DL", []);

	DL.config(['$httpProvider',
		function DLConfig($httpProvider) {
			// Main DL configuration and settings.

			$httpProvider.defaults.withCredentials = true;

			// JS data default Promise function.
			/**
			 * Using kriskowal/q Promises
			 * ref: "https://github.com/kriskowal/q"
			 */
			JSData.DSUtils.Promise = Q.Promise;
		}
	]);

	DL.factory("DS_FACTORY", [

		function () {
			var _dataStore = null;

			function _run() {
				_dataStore = new JSData.DS();
			}

			function _inject(params) {
			}

			function _defineResource(resouce_definition) {
				var _def = resouce_definition || {};
				_def.methods = resouce_definition.methods || {};
				_def.methods.DL_inject = function inject(res_data) {
					console.log(this);
					return this.inject(res_data);
				}
				console.log(_def);
				return _dataStore.defineResource(_def);
			}

			_run();

			return {
				defineResource: _defineResource
			}

		}]);

	DL.factory("DataProvider", [
		"$rootScope", "Connect",
		"$q", "$timeout",
		"WWHttpAdapter",
		"ORGANISATION", "NOTIFICATION", "USER", "GROUP", "POST",
		"FILE",
		'CHAT', 'CHATROOM',
		'PUSH_NOTI',
		'JOB', 'TASK', 'JOB_HISTORY','DASHBOARD',
		'FORM_TEMPLATE', 'FORM_FIELD', 'FORM',
		"PREFERENCE",
		"COUNTRY", "CITY",
		"AUDIT","EVENT","JOBTEMPLATE",
		"MEETING","SUBSCRIPTION","PAYMENT",
		"PEOPLE","WPAUDIT",

		function DataProvider($rootScope, Connect,
		                      $q, $timeout,
		                      WWHttpAdapter,
		                      ORGANISATION, NOTIFICATION, USER, GROUP, POST,
		                      FILE,
		                      CHAT, CHATROOM,
		                      PUSH_NOTI,
		                      JOB, TASK, JOB_HISTORY,DASHBOARD,
		                      FORM_TEMPLATE, FORM_FIELD, FORM,
		                      PREFERENCE,
		                      COUNTRY, CITY,
		                      AUDIT, EVENT, JOBTEMPLATE,
		                      MEETING, SUBSCRIPTION, PAYMENT,
		                      PEOPLE,WPAUDIT) {


			var __initDone = null;
			var _store = null;
			var _localStore = null;
			var _res = null;
			var _adapter = {};

			function _registerLocalStorageAdapter(storeName, options) {
				// var _deferred = $q.defer();
				var _storeName = storeName || "DL_localStorage";
				var _options = options || {}
				_options.default = _options || true;

				_adapter.localStorage = new DSLocalStorageAdapter();

				_localStore.registerAdapter(_storeName, _adapter.localStorage, _options);
				return _adapter.localStorage;
			}

			function _registerHttpAdapter(storeName, options) {
				var _storeName = storeName || "DL_http";
				var _options = options || {}
				_options.default = _options.default || true;

				_adapter.wwHttpAdapter = new WWHttpAdapter();

				_store.registerAdapter(_storeName, _adapter.wwHttpAdapter, _options);

				return _adapter.wwHttpAdapter;
			}

			function __constructor() {
				_res = {};
				// _localRes = {};
				_adapter = {};
				_store = new JSData.DS();
				_localStore = new JSData.DS();

				_init_resources();
			}

			function _init() {
				var _deferred = $q.defer();

				function __init() {
					_registerLocalStorageAdapter();
					_registerHttpAdapter();
					$timeout(function () {
						__initDone = true;
						_deferred.resolve();
					}, 10);
				}

				$timeout(function () {
					if (__initDone) {
						_deferred.resolve();
					} else {
						__init();
					}
				}, 10);

				return _deferred.promise;
			}

			function _init_resources() {
				_res.Organisation = _store.defineResource(ORGANISATION.config);
				ORGANISATION.initResource(_res.Organisation);
				_res.Notification = _store.defineResource(NOTIFICATION.config);

				_res.User = _store.defineResource(USER.config);

				_res.Group = _store.defineResource(GROUP.config);
				GROUP.initResource(_res.Group);

				_res.Post = _store.defineResource(POST.config);

				_res.File = _store.defineResource(FILE.config);

				_res.Preference = _localStore.defineResource(PREFERENCE.config);

				_res.ChatMessage = _localStore.defineResource(CHAT.config);

				_res.Chatroom = _localStore.defineResource(CHATROOM.config);

				_res.PushNoti = _localStore.defineResource(PUSH_NOTI.config);

				_res.Job = _store.defineResource(JOB.config);
				JOB.initResource(_res.Job);

				_res.Task = _store.defineResource(TASK.config);
				TASK.initResource(_res.Task);

				_res.FormTemplate = _store.defineResource(FORM_TEMPLATE.config);
				FORM_TEMPLATE.initResource(_res.FormTemplate);

				_res.FormField = _store.defineResource(FORM_FIELD.config);
				FORM_FIELD.initResource(_res.FormField);

				_res.Form = _store.defineResource(FORM.config);
				FORM.initResource(_res.Form);

				_res.JobHistory = _store.defineResource(JOB_HISTORY.config);
				
				_res.Dashboard = _store.defineResource(DASHBOARD.config);

				_res.Country = _store.defineResource(COUNTRY.config);

				_res.City = _store.defineResource(CITY.config);
				CITY.initResource(_res.City);

				_res.Audit = _store.defineResource(AUDIT.config);
				AUDIT.initResource(_res.Audit);
				
				_res.Event = _store.defineResource(EVENT.config);
				EVENT.initResource(_res.Event);
				
				_res.JobTemplate = _store.defineResource(JOBTEMPLATE.config);
				JOBTEMPLATE.initResource(_res.JobTemplate);
				
				_res.Meeting = _store.defineResource(MEETING.config);
				MEETING.initResource(_res.Meeting);
				
				_res.Subscription = _store.defineResource(SUBSCRIPTION.config);
				SUBSCRIPTION.initResource(_res.Subscription);
				
				_res.Payment = _store.defineResource(PAYMENT.config);
				PAYMENT.initResource(_res.Payment);
				
				_res.People = _store.defineResource(PEOPLE.config);
				PEOPLE.initResource(_res.People);
				
				_res.WPAudit = _store.defineResource(WPAUDIT.config);
				WPAUDIT.initResource(_res.WPAudit);
				
				
				/* -------------------------------- */
				/* Exposed resource object for development purposes */
				/* TODO: Remove data resource object from window in production */
				window.resource = _res;
				/* -------------------------------- */
			}

			function ServiceFactory(resourceName, apiName, options) {
				return new ContentProvider(apiName, options);
				function ContentProvider(apiName, options) {
					var self = this;
					self.apiName = apiName;
					self._status = {};
					return {
						fn: execute,
						query: query,
						isLoading: isLoading
					};

					function isLoading() {
						"use strict";

					}

					function execute() {
						var dataProviderResource = _res[resourceName];
						self._status.isLoading = true;
						return $q.when(dataProviderResource[apiName](options.params, options.options))
							.then(function (res) {
								"use strict";
								self._status.isLoading = false;
								return res;
							})
							.catch(function (err) {
								"use strict";
								self._status.isLoading = false;
								return err;
							})
					}

					function query(key) {
						"use strict";
					}
				}
			}

			/**
			 *
			 * @param resource
			 * @param apiName
			 * @param params
			 * @param pageSize
			 * @param options
			 * @returns {PaginatedListLoader}
			 * @constructor
			 */
			function PaginatedListLoaderFactory(resource, apiName, params, pageSize, options) {
				"use strict";
				var options = options || {};

				return new PaginatedListLoader(resource, apiName, params, {
					pageSize: pageSize || 25,
					apiParams: options.apiParams || {},
					getItemCount: options.getItemCount,
					autoIncrement: options.autoIncrement
				});

				/**
				 *
				 * @param context JS-Data resource object.
				 *
				 * @param apiName String: Name of the api to be invoked.
				 *
				 * @param params Object: request params object to be passed to the resource api.
				 *
				 * @param options Object:
				 *  - pageSize Integer: default page size
				 *  - autoIncrement Boolean: weather or not to increment he page number automatically
				 *      if the request is successfully.
				 *      If this value is false, `incrementPageNumber` has to be called
				 *      to bump up the page number for the next page request.
				 *
				 * @returns {{fn: execute, resetPagination: resetPagination, incrementPageNumber: incrementPageNumber,
				 *   paginationData: ({pageNumber: number, pageSize: *}|*)}}
				 *
				 * @constructor; `new PaginatedListLoader(Resource, 'findAll', {}, {pageSize: 20})`
				 */

				function PaginatedListLoader(context, apiName, params, options) {
					var self = this
						;
					self.store = {
						isLoading: false,
						hasNextPage: false,
						allPagesLoaded: false
					};
					self.resource = context;
					self.api = apiName;
					self.itemCounter = 0;
					self.paginationResponseData = {};
					self.params = params;
					self.options = options || {};
					self.apiParams = options.apiParams;
					self.options.pageSize = self.options.pageSize || 25;
					self.paginationData = {
						pageNumber: 1,
						pageSize: self.options.pageSize
					};
					self.options.autoIncrement
						= angular.isDefined(self.options.autoIncrement)
						? self.options.autoIncrement
						: true;

					return {
						fn: execute,
						resetPagination: resetPagination,
						incrementPageNumber: incrementPageNumber,
						isNextPageAvailable: isNextPageAvailable,
						resetItemCount: function (count) {
							self.itemCounter = count;
						},
						get paginationData() {
							return self.paginationData;
						},
						get itemCounter() {
							return self.itemCounter
						},
						getActivityStore: function getActivityStore() {
							return self.store;
						}
					};

					function execute() {
						var params = {}
							, deferred = $q.defer()
							;
						angular.extend(params, angular.copy(self.params), self.paginationData);

						self.store.isLoading = true;
						self.resource[self.api](params, self.apiParams)
							.then(function (res) {
									//var paginationData = findPaginationData();
									//if (paginationData) {
									//	self.paginationResponseData =
									//		angular.copy(paginationData);
									//}
									if (angular.isArray(res)) {
										self.itemCounter += res.length;
									}
									if (self.options.autoIncrement) {
										var nextPageNumber = self.paginationData.pageNumber;
										if (self.itemCounter >= self.paginationData.pageSize * self.paginationData.pageNumber) {
											nextPageNumber = self.paginationData.pageNumber + 1;
										}
										self.paginationData.pageNumber = nextPageNumber;
									}
									self.store.hasNextPage = isNextPageAvailable();
									deferred.resolve(res);
								}, null,
								function (noti) {
									if (noti && noti.resp
										&& noti.resp.paginationMetaData) {
										self.paginationResponseData = angular.copy(noti.resp.paginationMetaData);
									}
									deferred.notify(noti);
								})
							.catch(function (err) {
								self.store.error = err;
								deferred.reject((err))
							})
							.finally(function () {
								self.store.isLoading = false;
								_updateActivityStore();
							})
						;

						function findPaginationData() {
							var loadJobsActivityStore = self.resource['$_activityStore_' + self.api];
							if (self.resource.result && self.resource.result.resp.paginationMetaData) {
								return self.resource.result.resp.paginationMetaData;
							}
							else if (loadJobsActivityStore) {
								return loadJobsActivityStore.paginationMetaData;
							}
						}

						return deferred.promise;
					}

					function _updateActivityStore() {
						self.store.allPagesLoaded = !isNextPageAvailable();
					}

					function incrementPageNumber() {
						self.paginationData.pageNumber++;
					}

					function resetPagination(number) {
						self.itemCounter = 0;
						self.paginationData.pageNumber = angular.isDefined(number)
							? number : 1;
					}

					function isNextPageAvailable() {
						if (!self.paginationResponseData) return false;
						var itemCount = 0;
						if (options.getItemCount) {
							itemCount = options.getItemCount()
						} else {
							itemCount = self.itemCounter;
						}
						return itemCount < self.paginationResponseData.totalResults;
					}
				}

			}

			__constructor();
			_init();

			return {
				initialize: _init,
				store: _store,
				adapter: _adapter,
				localStore: _localStore,
				resource: _res,
				ServiceFactory: ServiceFactory,
				PaginatedListLoaderFactory: PaginatedListLoaderFactory,
				registerLocalStorageAdapter: _registerLocalStorageAdapter,
				registerHttpAdapter: _registerHttpAdapter,
				pluckAttrArrayProperties: __pluckUpdateAllProperties
			};

			function __pluckUpdateAllProperties(attrArray, properties) {
				"use strict";
				var newAttrArray = _.map(attrArray, function (file) {
					var props = {};
					_.each(properties, function (keyName) {
						if (angular.isDefined(file[keyName])) {
							props[keyName] = file[keyName];
						}
					});
					return props;
				})

				return newAttrArray;
			}

		}]);


})();
