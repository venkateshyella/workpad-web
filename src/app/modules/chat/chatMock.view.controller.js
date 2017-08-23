/**
 * Created by sudhir on 3/8/15.
 */

;
(function () {
  "use strict";

  angular.module('app')
    .controller('ChatMockViewController', [
      '$scope', '$rootScope', '$timeout', '$interval',
      '$document',
      'StropheService',
      'ChatterService', 'ChatterConnect',
      'DataProvider',
      ChatMockViewController
    ])
  ;

  function ChatMockViewController($scope, $rootScope, $timeout, $interval
    , $document, ChatService
    , ChatterService, ChatterConnect
    , DataProvider) {

    var SHOW_TIME_OFFSET_THRESHOLD = 5 * 60 * 60 * 1000
      , TIMESTAMP_UPDATE_THROTTLE = 2000
      , PAGE_SIZE = 10
      ;

    var self = this;

    var chatroomId = 'acbc144f9c4c4015a61106c2bfac32e6'
      , nickName = 'U' + $scope.session.userInfo.id + '-O135'
      , waitee
      ;

    $scope._connStatus = {
      isInARoom: false,
      connected: ChatterConnect.status == ChatterConnect.CONNECTION_STATUS.CONNECTED,
      sendMessage_inProgress: false
    };
    $scope._connStatusMessage = "";

    self.scopeListeners = {
      mockChatListeners: {}
    };
    $scope.messageStack = [];
    $scope.roomList = [];
    $scope.formModel = {
      newMessage: ""
    };

    $scope.$on('$destroy', function () {
      if (waitee) {
        waitee.destroy();
      }
    });
    $scope.disconnect = function () {
    };

    $scope.connect = function () {
    };

    $scope.loadOlderMessages = loadOlderMessages;

    $scope.sendMessage = sendMessage;

    $scope.joinChatroom = function () {
      ChatterService.readyChatroom(chatroomId, nickName)
        .then(function () {
          $scope._connStatus.isInARoom = true;
          $scope._connStatusMessage = "in chatroom";
          loadOlderMessages();
          waitee = ChatterService.waitForChatroomMessages(chatroomId, nickName);
          waitee.promise
            .then(null, null, function (message) {
              //console.log(noti);
              appendNewMessage(message)
            })
        })
        .catch(function () {
          $scope._connStatusMessage = "failed to join chatroom";
        })

    };

    $scope.leaveChatroom = function () {
      ChatterService.leaveChatroom(chatroomId)
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

    function appendNewMessage(message) {
      $scope.messageStack.push(message);
      $scope.messageStack = _.unique($scope.messageStack);
      _updateScroll();
    }

    function loadOlderMessages() {
      DataProvider.resource.ChatMessage.findAll({
        where: {
          _chatroomId: {
            '==': chatroomId
          }
        },
        orderBy: [['timestamp', 'DESC']],
        offset: $scope.messageStack.length,
        limit: PAGE_SIZE
      }, {bypassCache: true})
        .then(function(res) {
          $scope.messageStack = _.unique(res.reverse().concat($scope.messageStack));
          $timeout(function() {_updateScroll();}, 500);
        })
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
    }

    function onAuthFail() {
      $scope._connActive = false;
    }

    function onError() {
      $scope._connActive = false;
    }

    function onInputFieldKeyPress($event, msg) {
      if ($event.keyCode == 13) {
        sendMessage();
      }
    }

    function sendMessage() {
      if ($scope.formModel.newMessage) {
        //$scope._connStatus.sendMessage_inProgress = true;
        var msgObj = ChatService.prepareGroupChatMessageJSON($scope.formModel.newMessage
          , $scope.session.userInfo.userFirstName);
        ChatterService.sendMessageToChatroom(chatroomId, msgObj)
          .then(function (result) {
            //console.log(result);
            //appendNewMessage(result);
            $scope.formModel.newMessage = "";
          })
          .finally(function () {
            $scope._connStatus.sendMessage_inProgress = false;
          })
        ;
      }
    }

    var _updateScroll = _.throttle(function _updateScroll() {
        self.scrollListElem = mobos.Platform.isIOS()
          ? self.scrollListElem || document.getElementById('mockChatListView').parentNode
          : document.body
        ;

        $timeout(function () {
          mobos.DomUtil.scrollToBottom(self.scrollListElem);
        }, 100);

      },
      500, {
        trailing: true
      });

    var _computeTimeStampOffset = _.throttle(function _computeTimeStampOffset() {
        var currDateTime = new Date();
        $timeout(function () {
          angular.forEach($scope.messageStack, function (message) {
            var offset = mobos.Utils.getDateTimeOffset(message.timestamp, currDateTime);
            if (offset.milli < SHOW_TIME_OFFSET_THRESHOLD) {
              if (offset.hr > 0) {
                message.displayTime = offset.hr + "h"
              } else if (offset.min > 0) {
                message.displayTime = offset.min + "m"
              } else {
                message.displayTime = offset.sec + "s"
              }
            } else {
            }
          });
        });
      },
      500, {
        trailing: true
      });

  }

})();