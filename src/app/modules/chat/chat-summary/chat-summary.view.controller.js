/**
 * Created by sudhir on 19/10/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.controller('ChatSummaryViewController', [
			'$scope', '$controller', '$q', 'DataProvider', 'Connect', 'URL',
			ChatSummaryViewController
		]);

	function ChatSummaryViewController($scope, $controller, $q
		, DataProvider, Connect, URL) {

		var self = this
			, chatSummaryList = []
			;

		self.fetchSummary = fetchSummary;
		self.paginatedChatSummaryLoader
			= DataProvider.PaginatedListLoaderFactory(self, 'fetchSummary', {}, 25);

		angular.extend(self, $controller('ViewDataBaseController', {$scope: $scope}));
		self.chatSummaryLoader
			= self.initializeViewDataBaseController('chatSummary', fetchSummary, getSummary);

		$scope.refresh = refresh;
		$scope.onChatSummaryItemClick = onChatSummaryItemClick;

		refresh();

		function refresh() {
			self.paginatedChatSummaryLoader.resetPagination();
			$scope.chatSummaryListData = chatSummaryList = [];
			$scope.chatSummary.refresh()
				.then(function (res) {
					$scope.chatSummaryListData = chatSummaryList;
					_updatePaginationFlags(res);
				})
			;
		}

		function refreshNextPage() {
			//self.paginatedChatSummaryLoader.incrementPageNumber();
			$scope.chatSummary.refresh()
				.then(function (res) {
					$scope.chatSummaryListData = chatSummaryList;
					_updatePaginationFlags(res);
				})
			;
		}

		function _updatePaginationFlags(res) {

		}

		function onChatSummaryItemClick(item) {
			var _targetRoute = _getChatroomRoute(item);
			_targetRoute &&
			$scope.transitionTo(_targetRoute.name, _targetRoute.params);

			function _getChatroomRoute(item) {
				var route = {};
				switch (item.chatType) {
					case 'ORGANIZATION':
						route.name = 'root.app.org-dashboard.orgChat';
						if (!item.organization) {
							return null;
						} else {
							route.params = {
								orgId: item.organization.id
							}
						}
						break;
					case 'GROUP':
						route.name = 'root.app.group-dashboard.groupChat';
						if (!item.organization || !item.group) {
							return null;
						} else {
							route.params = {
								orgId: item.organization.id,
								groupId: item.group.groupId
							}
						}
						break;
					case 'JOB':
						route.name = 'root.app.job-view.jobChat';
						if (!item.job) {
							return null;
						} else {
							route.params = {
								jobId: item.job.id
							}
						}
						break;

					default:
						return null
				}
				return route;
			}
		}

		function fetchSummary(params, options) {
			var deferred = $q.defer();
			Connect.get(URL.CHAT_SUMMARY, params)
				.then(function (res) {
					chatSummaryList = chatSummaryList.concat(res.resp);
					deferred[res.isSuccess ? 'resolve' : 'reject'](res);
				})
				.catch(function (err) {
					deferred.reject(err);
				})
			;
			return deferred.promise;
		}

		function getSummary() {
			return chatSummaryList;
		}

	}

})();