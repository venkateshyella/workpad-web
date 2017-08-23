// routeResolve.service.js

(function () {

	angular.module('app')
		.service('RouteResolver', RouteResolver);

	function RouteResolver($rootScope, $state, Session, $location) {

		function _initialize() {
		}

		function _previous() {
		}

		function _resolveNextState() {
			return {
				name: "root.app.dashboard",
				params: {}
			}
		}

		function _resolveFirstState() {
			var nextState = {

				name: 'root.app.dashboard',
				params: {},

				//name: 'root.app.task-dashboard.taskMembers',  // taskProfile taskMembers taskChat taskVault
				//params: {
				//	jobId: 568,
				//	taskId: 396
				//},

				// name: 'root.app.job-view.jobAudit',  // jobMembers jobChat jobVault jobTask jobAudit
				// params: {
				// 	jobId: 8
				// },

				// name: 'root.app.org-dashboard.orgAudit', // orgAudit orgInfo orgMembers orgGroups orgJobs orgAnalysis
				// params: {
				// 	orgId: 135
				// },

				//name: 'root.app.org-list',
				//params:{
				//	userId: 3
				//},

				// name: 'root.app.group-dashboard.groupAudit',
				// params: {
				// 	orgId: 135,
				// 	groupId: 10
				// },


				//name: 'root.app.job-view',
				//params: {
				//	jobId: 476,
				//	tab: 'TAB_INFO'
				//},

				// name: 'root.app.job-list.openJobList', // openJobList pendingTimesheetJobList pendingRatingJobList
				// params: {},

				//name: 'root.app.org-dashboard.orgInfo',
				//params: {
				//	orgId: 1541
				//},

				//name: 'root.app.task-dashboard.taskProfile',
				//params: {
				//	jobId: 474,
				//	taskId: 291
				//},

			};
			
			if (!_isSessionValid() && $location.url().indexOf('register') == -1 
					&& $location.url().indexOf('appDownload') == -1) {
				nextState.name = "root.login";
				nextState.params = {};
			} else if ($location.url().indexOf('register') == 1) {
				nextState.name = "root.register";
				nextState.params = {};
			} else if ($location.url().indexOf('appDownload') == 1) {
				nextState.name = "root.appDownload";
				nextState.params = {};
			} else {
				nextState.params.id = Session.userId;
			}

			return nextState
		}

		return {
			initialize: _initialize,
			previous: _previous,
			resolveNextState: _resolveNextState,
			resolveFirstState: _resolveFirstState,
			defaultState: _defaultState
		};

		function _defaultState() {
		}

		function _isSessionValid() {
			return Session.id
		}

	}

	RouteResolver.$inject = ['$rootScope', '$state', 'Session', '$location'];

})();
