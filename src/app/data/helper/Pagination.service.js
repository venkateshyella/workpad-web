/**
 * Created by sudhir on 26/5/16.
 */

angular.module('DL')
	.factory('PaginationFactory', [
		'$q',
		function($q) {
			"use strict";
			return function PaginatedListLoaderFactory(resource, apiName, params, pageSize, options) {
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
						self.store.allPagesLoaded = false;
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
		}
	])
