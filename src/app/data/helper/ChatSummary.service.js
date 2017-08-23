/**
 * Created by sudhir on 3/11/15.
 */

;
(function () {
	"use strict";

	angular.module('app.services')
		.service('ChatSummaryLoader', [
			'$q', 'Connect', 'URL',
			ChatSummaryLoader])
	;

	function ChatSummaryLoader($q, Connect, URL) {
		var chatSummaryList = [];
		return {
			fn: fetchChatSummary
		};

		function fetchChatSummary(options) {
			var deferred = $q.defer();
			Connect.get(URL.CHAT_SUMMARY)
				.then(function (res) {
					chatSummaryList = res.resp;
					deferred[res.isSuccess ? 'resolve' : 'reject'](chatSummaryList);
				})
				.catch(function (err) {
					deferred.reject(err);
				})
			;
			return deferred.promise;
		}
	}

})();
