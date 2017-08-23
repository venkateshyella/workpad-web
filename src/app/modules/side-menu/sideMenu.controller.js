/**
 * Created by sudhir on 12/5/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.controller('SideMenuController', [
			'$scope', '$rootScope', '$q', '$timeout',
			'PushNotificationService',
			'Subscribe', 'blockUI',
			'DEFAULT_ENDPOINT',
			'AuthService', 'DataProvider', 'SAVED_PREFERENCES_KEY',
			SideMenuController]);

	function SideMenuController($scope, $rootScope, $q
		, $timeout, PushNotificationService
		, Subscribe, blockUI
		, DEFAULT_ENDPOINT
		, AuthService, DataProvider, SAVED_PREFERENCES_KEY) {

		var self = this;

		self._debug_ENABLE_DEBUG_COUNT = 5;
		self._debug_Counter = 1;
		self._debug_CancelTimer = null;
		self._debug_toggleEnabled = true;
		self._debug_TOGGLE_DEBOUNCE = 200;
		self._debug_preferences = DataProvider.resource.Preference
				.get(SAVED_PREFERENCES_KEY.ENABLE_DEBUG) || {};

		$scope.action = {
			logout: logout,
			logout_inProgress: false,
			triggerEnableDebug: triggerEnableDebug,
			toggleDebugMode: function (isEnabled) {
				isEnabled = angular.isDefined(isEnabled)
					? isEnabled
					: (isEnabled ? false : true);
				isEnabled ? enableDebugMode() : disableDebugMode();
			},
			enableDashboardItem: enableDashboardItem
		};

		$scope.dashboardItems = {
			dashboard: {},
			profile: {},
			my_orgs: {},
			my_tpl: {},
			my_jobs: {},
			settings: {},
			subscribers: {},
			account:{},
			people:{},
			audit:{}
		};

		$rootScope._debug = (self._debug_preferences && self._debug_preferences.isEnabled) || false;

		$scope.unreadNotificationModel = null;
		$scope.onChatNotificationClick = onChatNotificationClick;

		_initChatNotificationPanel();

		function _initChatNotificationPanel() {
			PushNotificationService.waitForNewNotification(
				PushNotificationService.PUSH_NOTIFICATION_TYPE.CHAT_SUMMARY,
				'SIDE_MENU_CHAT_MESSAGE_RECEIVER'
			).then(angular.noop, angular.noop, function () {
					$scope.unreadNotificationModel = DataProvider.resource.PushNoti.filter({
						where: {
							'payload.t': {'==': 20},
							'isRead': false
						},
						limit: 1,
						orderBy: 'created_at'
					});
					$scope.unreadNotificationModel.length > 0
						? ($scope.unreadNotificationModel = $scope.unreadNotificationModel[0])
						: ($scope.unreadNotificationModel = null)
					;
				})

		}

		function onChatNotificationClick() {
			$scope.unreadNotificationModel &&
			$scope.unreadNotificationModel.toggleRead(true);

			$scope.resetTransitionTo('root.app.user-chat-summary');

		}

		function enableDashboardItem(itemName) {
			if ($scope.dashboardItems[itemName]) {
				$scope.sharedData.sideMenu.currItem = itemName;
			}
		}

		function enableDebugMode() {
			$rootScope._debug = $scope._debug = true;
			self._debug_preferences.isEnabled = true;
			DataProvider.resource.Preference.create({
				id: SAVED_PREFERENCES_KEY.ENABLE_DEBUG,
				name: "app_debug",
				value: self._debug_preferences.value,
				isEnabled: $rootScope._debug
			}).then(function () {
			}, null, null);
		}

		function disableDebugMode() {
			$rootScope._debug = $scope._debug = false;
			self._debug_preferences.isEnabled = false;
			DataProvider.resource.Preference.create({
				id: SAVED_PREFERENCES_KEY.ENABLE_DEBUG,
				name: "app_debug",
				value: self._debug_preferences.value,
				isEnabled: $rootScope._debug
			}).then(function () {
			}, null, null);
		}

		function resetTransitionTo(route, params) {
		}

		function triggerEnableDebug() {

			if (self._debug_Counter == self._debug_ENABLE_DEBUG_COUNT) {
				enableDebugMode();
			} else {
				self._debug_Counter++;
				self._debug_toggleEnabled = false;

				$timeout(function () {
					self._debug_toggleEnabled = true;
				}, self._debug_TOGGLE_DEBOUNCE);
			}


			if (!self._debug_CancelTimer) {
				self._debug_CancelTimer = $timeout(function () {
					self._debug_Counter = 1;
					delete(self._debug_CancelTimer)
				}, 5000);
			}
		}

		function logout() {
			if (self.logout_inProgress) {
				return;
			}
			blockUI.start('Logging Out..');
			DataProvider.resource.Preference.destroyAll()
				.then(function () {
					var deferred = $q.defer();
					$q.all([
//						_unSubscribe(),
 						_checkAndExitMeeting(),
						_sendLogout()
					])
						.then(function (res) {
							deferred.resolve(res);
						})
						.catch(function (error) {
							deferred.reject(error);
						});
					return deferred.promise;
				})
				.then(function () {
					blockUI.stop('You have been successfully logged out.', {
						status: "isSuccess"
					});
					$timeout(function () {
						window.location.reload();
					}, 1000)
				})
				.catch(function (error) {
					console.log(error);
					blockUI.stop('There were some error', {
						status: 'isError'
					});
					$timeout(function () {
						window.location.reload();
					}, 2000)
				})
		}

		function _sendLogout() {
			return AuthService.logout();
		}
		
		//check if any meeting is in progress and leave/end meeting.
		function _checkAndExitMeeting() {
			var deferred = $q.defer();
			
			if($scope.isMeetingInProgress){
				var params = {
				catType : $scope.meetingInfo.catType,
				catId : $scope.meetingInfo.catId,
				meetingId: $scope.meetingInfo.meetingId,
				isModerator : $scope.isModerator
				};
				
				$scope.leaveMeeting(params).then(function(){
					deferred.resolve();
				});
			}else{
				deferred.resolve();
			}
			
			return deferred.promise;
		}

		function _unSubscribe() {
			return Subscribe.updateSubscription({
				enabled: false
			});
		}

	}

})();