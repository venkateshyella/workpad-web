/**
 * Created by sudhir on 3/8/15.
 */


;(function () {
	"use strict";

	angular.module('app')
		.directive('chatWindow', ['$timeout','$rootScope','Connect', 'URL', ChatWindowDirective])
	;

	function ChatWindowDirective($timeout, $rootScope, Connect, URL) {


		return {
			restrict: 'E',
			//priority: 0,
			link: {
				pre: preLink,
				post: postLink
			},
			require: ['^^row'],
			scope: {
				onJoinEvent: '&',
				onSentEvent: '&',
				onSendingEvent: '&',
				onErrorEvent: '&',
				chatroomId: '=',
				nickname: '=',
				placeholder: '=',
				optParams: '=',
				forceChatReload: "=?"
			},
			templateUrl: 'app/modules/chat/chatWindow.partial.html',
			controller: 'ChatSessionBaseController'
		};

		function preLink(scope, elem, attrs) {

		}

		function postLink(scope, elem, attrs, ctrls) {

			function render(){	
				console.log(scope.chatroomId);
				console.log(scope.nickname);


				function broadcastChatReady(params){
					scope.$broadcast('$ChatWindow:ready', params);
				}

				if(scope.optParams){

					Connect.get(URL.CHAT_PROFILE,scope.optParams).then(function(res){
						var chatRoomEncKey = res.resp.chatRoomKey;
						broadcastChatReady({
							chatroomId: scope.chatroomId,
							nickname: scope.nickname,
							chatRoomEncKey : chatRoomEncKey
						});
					}, function(error){

					});
				}else{
					broadcastChatReady({
						chatroomId: scope.chatroomId,
						nickname: scope.nickname
					});
				}

				var rowCtrl = ctrls[0];
				scope.rowCtrl = rowCtrl;
			}

			if(typeof scope.forceChatReload != undefined){
				scope.$watch('chatroomId', function (newValue, oldValue) {
					if (newValue || !angular.equals(newValue, oldValue)){
						console.log("reloading...");
						render();
					}
				}, true);

			}else{
				render();
			}
		}
		

	}

})();