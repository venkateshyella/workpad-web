/**
 * Created by sudhir on 19/10/15.
 */

;(function() {

	var DL = angular.module("DL");

	DL.service('PUSH_NOTI', [
		function PushNotificationSchema() {

			var meta = {}
				, _res
				, PushNotificationDefinition = {
					name: "PushNoti",
					computed: {
						isRead: {
							enumerable: true,
							get: function() {
								"use strict";
								return !!this._isRead;
							}
						}
					},
					methods: {
						toggleRead: function(isRead) {
							"use strict";
							if(angular.isDefined(isRead)) {
								this._isRead = !!isRead;
							} else {
								this._isRead = !this._isRead;
							}
							return this;
						}
					},
					endpoint: "NOTI",
					customEndpoint: {},
					beforeCreate: function(resource, attrs, cb) {
						"use strict";

						attrs.created_at = Date.now();
						attrs._isRead = false;

						cb(null, attrs);
					},
					respAdapter: {},
					reqAdapter: {}
				}
				;

			return {
				config: PushNotificationDefinition
			}
		}
	])

})();