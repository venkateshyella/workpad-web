/**
 * Created by sudhir on 18/5/16.
 */

;
(function () {

	var DL = angular.module("DL");

	DL.service('AUDIT', [
		'PaginationFactory',
		'Session', 'URL',
		function (PaginationFactory, Session, URL) {

			var meta = {}
				, resource
				, auditDisplayTimeFormatter
				;

			// auditDisplayTimeFormatter = mobos.Utils.createDateFormatter('DD/MM/YYYY');
			auditDisplayTimeFormatter = mobos.Utils.getDisplayDateTimeOffset;

			return {
				config: {
					name: "Audit",
					idAttribute: 'auditLogId',
					schema: {},
					computed: {
						$_displayTime: ['updateTime', function (timestamp) {
							return auditDisplayTimeFormatter(timestamp);
						}]
					},
					methods: {
						getMeta: function () {
							return meta;
						}
					},
					endpoint: "/audit",
					customEndpoint: {
						findAll: '/list.ws'
					},
					respAdapter: {},
					reqAdapter: {}
				},
				initResource: function (newResource) {
					"use strict";
					resource = newResource;
				},
				AuditPageFactory: function (auditListArray, url, params) {
					resource.createCollection(auditListArray, {});
					return PaginationFactory(
						auditListArray, 'fetch', params, 25, {
							apiParams: {
								url: url,
								bypassCache: true
							}
						})
				}
			}
		}
	])

})();
