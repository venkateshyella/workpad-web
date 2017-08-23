/**
 * Created by sudhir on 7/9/15.
 */


;
(function () {
	"use strict";

	angular.module('app')
		.controller('ChatSessionBaseController', [
			'$scope', '$rootScope', '$timeout', '$interval',
			'$document',
			'Session', 'AppCoreUtilityServices',
			'StropheService',
			'ChatterService', 'ChatterConnect',
			'DataProvider', 'State',
			ChatSessionBaseController
		])
	;

	function ChatSessionBaseController($scope, $rootScope, $timeout, $interval
		, $document
		, Session, AppCoreUtilityServices
		, ChatService
		, ChatterService, ChatterConnect
		, DataProvider, State) {

		var SHOW_TIME_OFFSET_THRESHOLD = 5 * 60 * 60 * 1000
			, TIMESTAMP_UPDATE_THROTTLE = 2000
			, PAGE_SIZE = 10
			;

		var self = this;

		var chatroomId, nickName
			, waitee
			;

		$scope._connStatus = {
			isInARoom: false,
			connected: ChatterConnect.status == ChatterConnect.CONNECTION_STATUS.CONNECTED,
			sendMessage_inProgress: false
		};
		$scope._connStatusMessage = "";

		$scope.messageStack = [];
		$scope.messageStackInfo = {
			isOlderMessagesPending: true
		};
		$scope.chatFormModel = {
			newMessage: ""
		};
		$scope.session = Session;

		$scope.$on('$destroy', function () {
			if (waitee) {
				waitee.destroy();
			}
			$scope.leaveChatroom();
			console.log('chat session destroy!');
		});

		$scope.$on('$ChatWindow:ready', function (event, args) {
			
			if (waitee) {
				waitee.destroy();
			}
			chatroomId = "";
			//$scope.leaveChatroom();
			
			init_chatView();
			$scope.joinChatroom(args);
		});

		$scope.loadEarlierMessages = function () {
			$scope._connStatus.loadingMessages = true;
			console.log(chatroomId);
			return ChatterService.fetchOlderChatroomMessages($scope.chatroomId, 25,
					$scope.messageStackInfo.currentOldestMessageTimestamp || null)
				.then(function (res) {
					if (res.length > 0) {
						$scope.messageStackInfo.currentOldestMessageTimestamp = res[res.length - 1].timestamp;
					} else {
						$scope.messageStackInfo.isOlderMessagesPending = false;
					}
					$scope.messageStack = _.unique(res.reverse().concat($scope.messageStack));
					$timeout(function () {
					});
				})
				.catch(function () {
				})
				.finally(function () {
					$scope._connStatus.loadingMessages = false;
				})
				;
		};
		$scope.sendMessage = sendMessage;
		$scope.util = AppCoreUtilityServices;
		$scope.chatUserProfileDetail = chatUserProfileDetail;

		function chatUserProfileDetail(userId) {
			State.transitionTo('root.app.user', {
				id: userId
			});
		}

		$scope.joinChatroom = function (optParams) {
			$scope.messageStack = [];
			$scope.messageStackInfo.currentOldestMessageTimestamp = null;
			
			console.log('joining ' + $scope.nickname + '@' + $scope.chatroomId);
			return ChatterService.readyChatroom($scope.chatroomId, $scope.nickname, {params : optParams})
				.then(function () {
					$scope._connStatus.isInARoom = true;
					if ($scope.onJoinEvent) {
						$scope.onJoinEvent();
					}
					$scope._connStatusMessage = $scope.placeholder || 'Enter Message';
					$scope.loadEarlierMessages()
						.then(function () {
							$timeout(function () {
								_updateScroll();
							}, 200);
						});
					waitee = ChatterService.waitForChatroomMessages($scope.chatroomId);
					waitee.promise
						.then(null, null, function (message) {
							//console.log("message stack ==>"+message);
							appendNewMessage(message);
						})
						
						$rootScope.$broadcast('REFRESH_NOTIFICATIONS');
				})
				.catch(function () {
					$scope._connStatusMessage = "failed to join chatroom";
				})

		};

		$scope.leaveChatroom = function () {
			ChatterService.leaveChatroom($scope.chatroomId)
				.then(function () {
					$scope._connStatus.isInARoom = false;
					console.log("left chatroom!!");
				})
				.catch(function () {
					console.log("unable to leave chatroom!!");
				})
			;
		};

		$scope.flush = function () {
			ChatterService.flushOMQ()
				.then(function (res) {
					//console.log(res);
				})
				.catch(function () {
				})
			;
		};

		$scope.onInputFieldKeyPress = onInputFieldKeyPress;

		$scope.$on('newChatroomMessage', function ($event, data) {
			console.log('newChatroomMessage');
			//console.log(data);
			sendMessage(data.message);
		});

		//$scope.joinChatroom();

		function init_chatView() {
			/* Chat-window scroll view element */
			var el_scrollingList;
			if (mobos.Platform.isWebView()) {
				el_scrollingList = document.body
			}
			else if (mobos.Platform.isIOS()) {
				el_scrollingList = document.getElementsByClassName('name-chatListView');
				el_scrollingList = (el_scrollingList.length > 0)
					? el_scrollingList[0].parentNode
					: null;
			} else {
				el_scrollingList = document.body
			}
			self.scrollListElem = el_scrollingList;
		}

		function appendNewMessage(newMessage) {
			if (_.findIndex($scope.messageStack, function (message) {
					return newMessage.id == message.id;
				}) == -1) {
				$scope.messageStack.push(newMessage);
			}
			//$scope.messageStack.push(newMessage);
			//$scope.messageStack = _.unique($scope.messageStack);
			_updateScroll();
		}

		function onConnect() {
			$scope.messageStack = [];
			$scope._connStatus.isConnected = true;
			$scope._connActive = false;

			$timeout(function () {
				$scope.joinRoom();
			}, 500);
		}

		function showConnectNotification(msg) {
			$timeout(function () {
				$scope._connStatusMessage = msg;
			});
		}

		function onDisconnect() {
			$scope._connActive = false;
			$scope._connStatus.isConnected = false;
			if ($scope.onJoinEvent) {
				$scope.onJoinEvent(true)
			}
		}

		function onAuthFail() {
			$scope._connActive = false;
		}

		function onError() {
			$scope._connActive = false;
		}

		function onActionNewMessage() {
			console.log($scope.messageText);
		}

		function onInputFieldKeyPress($event, msg) {
			$scope._connStatus.sendMessage_error = false;
			if ($event.keyCode == 13) {
				//sendMessage();
			}
		}

		function sendMessage(message) {
			//console.log(message);
			//var newMessage = $scope.chatFormModel.newMessage;
			var newMessage = message
				, fromUserDisplayName = Session.userInfo.userFirstName + ' ' + Session.userInfo.userLastName;
			if (newMessage) {
				$scope._connStatus.sendMessage_error = false;
				$scope._connStatus.sendMessage_inProgress = true;
				$scope.onSendingEvent && $scope.onSendingEvent();
				var msgObj = ChatService.prepareGroupChatMessageJSON(
					newMessage,
					fromUserDisplayName);
				$scope.inTransitMessage = angular.extend({},msgObj);
				$timeout(function () {
					$scope.rowCtrl.updateWebScroll('bottom');
				});
				ChatterService.sendMessageToChatroom($scope.chatroomId, msgObj)
					.then(function (result) {
						$scope.chatFormModel.newMessage = "";
						$scope.onSentEvent && $scope.onSentEvent(result);
					})
					.catch(function (err) {
						$scope.onErrorEvent && $scope.onErrorEvent(err);
						$scope._connStatus.sendMessage_error = err;
					})
					.finally(function () {
						$scope._connStatus.sendMessage_inProgress = false;
					})
				;
				$timeout(function () {
					_updateScroll();
				}, 100);
			}
		}

		var _updateScroll = _.throttle(function () {
			$scope.rowCtrl.updateWebScroll({scrollTo: 'bottom'});
		}, 200, {
			//wait: 10,
			leading: false,
			trailing: true
		});

		var _computeTimeStampOffset = _.throttle(function _computeTimeStampOffset() {
			//var currDateTime = new Date();
			$timeout(function () {
				angular.forEach($scope.messageStack, function (message) {
					message.displayTime = mobos.Utils.getDisplayDateTimeOffset(message.timestamp);
				});
			});
		},
			1000 * 60, {
				trailing: true
			});

	}

})();