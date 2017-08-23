/**
 * Created by sudhir on 17/11/15.
 */

;
(function () {

	var DL = angular.module("DL");

	DL.service('JOB_HISTORY', [
		'Session', 'URL',
		function JobHistorySchema(Session, URL) {

			var meta = {};

			return {
				config: {
					name: "JobHistory",
					idAttribute: 'eventHistoryId',
					schema: {},
					computed: {},
					methods: {
						getMeta: function () {
							return meta;
						}
					},
					endpoint: "/job",
					customEndpoint: {
						findAll: '/history.ws'
					},
					respAdapter: {},
					reqAdapter: {}
				}
			}
		}
	])

})();