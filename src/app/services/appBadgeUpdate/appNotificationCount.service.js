/**
 * Created by sudhir on 10/12/15.
 */


;(function() {
	"use strict";

	angular.module('app.services')
		.service('AppNotificationCountService', [
			'$q', 'Connect', 'URL',
			function($q, Connect, URL) {

				return {
					fetchNotificationCount: function() {
						var deferred = $q.defer();

						Connect.get(URL.NOTIFICATION_COUNT)
							.then(function(res) {
								if(!res.isSuccess) {
									deferred.reject(res);
								}
								var responseData = res.resp;
								if(typeof responseData.count != 'undefined') {
									deferred.resolve(responseData.count);
								} else {
									deferred.reject(res);
								}
							})
							.catch(function(err) {
								deferred.reject(err);
							})
						;

						return deferred.promise;
					}
				}

			}
		])

})();