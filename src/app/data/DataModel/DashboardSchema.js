/**
 * Created by sudhir on 28/10/15.
 */

(function () {
	"use strict";
	var DL = angular.module("DL");

	DL.service('DASHBOARD', ['$q','Session', 'Connect', 'URL','$timeout','blockUI',
		function ($q, Session, Connect, URL,$timeout,blockUI) {
			var
				 meta = {},
				resource = null,
				config = {
					name: "Dashboard",
					meta: meta,
					defaultValues: {},
					relations: {},
					endpoint: "/dashboard",
					computed: {},
					methods: {
						toJSON: function (options) {
							var _options = options || {}
								, self = this
								, filter = _options.filter || resource.meta.JSON_filter.default
								;
							return _.pick(self, filter);
						}
					},
						fetchDashBoardInfo: function () {
							var deferred = $q.defer();
							var params = {
								userSessionId:Session.id
							};
							Connect.get(URL.DASHBOARD_INFO, params)
								.then(function (res) {
									deferred.resolve(res.resp);
								})
								.catch(function (err) {
									deferred.reject(err);
								})
							;

							return deferred.promise;
						}
				
					
				};
			return {
				config: config,
				initResource: function  (newResource) {
					resource = newResource;
				}
			}
		}
	])
})();