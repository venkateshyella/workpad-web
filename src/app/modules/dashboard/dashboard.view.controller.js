/**
 * Created by sudhir on 12/5/15.
 */

;
(function () {

	angular.module('app.modules')
		.controller('DashboardViewController', [
			'$scope', '$q', '$rootScope', '$controller', '$timeout',
			'State', 'DataProvider',
			'$mdToast', 'AppBadgeService',
			'PostControllerService', 'PostService', 'PushNotificationService',
			'ChatSummaryLoader',
			'Lang', 'APP_BROADCAST', 'PUSH_NOTIFICATION_TYPE', 'mDialog',
			'AppCoreUtilityServices',
			DashboardController
			]);
			
	function DashboardController($scope, $q, $rootScope, $controller, $timeout
		, State, DataProvider, $mdToast
		, AppBadgeService
		, PostControllerService, PostService, PushNotificationService
		, ChatSummaryLoader
		, Lang, APP_BROADCAST, PUSH_NOTIFICATION_TYPE, Dialog
		, AppCoreUtilityServices) {

		var self = this
			, LANG = Lang.en.data
			, deregisterNotificationListener = null
			, DASHBOARD_NOTIFICATION_CHAT = "NEW_DASHBOARD_POST_REFRESH_CHAT"
			, DASHBOARD_NOTIFICATION_POST = "NEW_DASHBOARD_POST_REFRESH_POST"

			, notificationAuditCollection = []
			, notificationAuditData = []
			, notificationAuditLoader
			;

		angular.extend(self, $controller('ViewDataBaseController', {
			$scope: $scope
		}));

		self.viewData = {
			//posts: self.initializeViewDataBaseController('postList', fetchPosts, getPosts),
			//chatSummaryLoader: self.initializeViewDataBaseController('chatSummary', fetchChatSummary),
		};
		self.optionsMenu = {
			items: [{
				name: 'refresh',
				value: LANG.OPTIONS_MENU.REFRESH
			}],
			handlers: {}
		};
		//_init();
		State.waitForTransitionComplete()
			.then(function () {
				
				$rootScope.$broadcast('DashboardController:ENTER');

			});
		
		function getDashBoardDetails() {

			var deferred = $q.defer();

				DataProvider.resource.Dashboard.fetchDashBoardInfo({
						bypassCache: true,
					})
					.then(function (res) {
						$scope.dashboradList= [];
						var resultObject = res;
						
						$scope.jobObj = resultObject.jobs;
						
						var orgObj = resultObject.organizations;
						var reportData = {
								  total: orgObj.total,
							      owned: orgObj.owned,
							      member:orgObj.member, 
								  icon:'icon-domain',
								  title:'WorkSpaces'
						};
						$scope.dashboradList.push(reportData);
						
						var groupObj = resultObject.groups;
						var reportData1 = {
								  total: groupObj.total,
							      owned: groupObj.owned,
							      member:groupObj.member, 
								  icon:'icon-group-work',
								  title:'rooms'
						};
						$scope.dashboradList.push(reportData1);
						
						var docsObj = resultObject.docs;
						var reportData3 = {
								  total: docsObj.total,
								  owned: docsObj.owned,
								  member:docsObj.member, 
								  icon:'icon-drive-document',
								  title:'docs'
						};
						$scope.dashboradList.push(reportData3);
						deferred.resolve(res);

					}).catch(function (error) {
					deferred.reject();
					console.log(error);
				}).finally(function () {
					blockUI.stop();
				});
			return deferred.promise;

		};

		getDashBoardDetails();
		
		$rootScope.$on("DashboardInfo", function (event, args) {
			getDashBoardDetails();
		});


	}

})();
