/**
 * Created by sudhir on 3/8/15.
 */


;
(function () {
  "use strict";

  angular.module('chatter', ['mobos.utils'])
    .provider('StropheService', [
      StropheServiceProvider])
  ;

  function StropheServiceProvider() {
    var TAG_NAME = "StropheService";

    var config = {
      MAX_CONNECTIONS: 1,
      MAX_ROOMS: 1,
      HOST: 'localhost'
    };
    var connection = {
        conn: null,
        deferredBucket: {},
        action: {},
        connectionStatus: 'inactive',
        sessionStatus: 'inactive'
      }
      , connectionCallback = null
      , connectionListenerBucket = {}
      , forwardEventScopes = {}
      , activeRooms = []
      ;

    return {
      $get: ['$q', 'Session', StropheService]
    };

    function StropheService($q, Session) {
      var api = {
        /**
         * Initialize a new connection.
         * (Note that currently ony one connection is supported.)
         *
         * @param endpoint
         * @param options
         * @returns {Strophe.Connection}
         */
        initialize: function (endpoint, options) {
          if (connection.conn) {
            return connection.conn;
          } else {
            if (connection.sessionStatus == "active"
              && connection.roomInfo
              && connection.roomInfo.nickname) {
              api.exitRoom(connection.roomInfo.roomId, connection.roomInfo.nickname);
            }
            if (connection.conn) {
              connection.conn.disconnect();
            }
            var newConnection = new Strophe.Connection(endpoint);
            connection.conn = newConnection;
            connection.endpoint = endpoint;
            connection.options = angular.copy(options);
            return connection.conn;
          }
        },
        resetConnection: function () {
          connection.conn = null;
          connection.deferredBucket = {};
          connection.action = {};
          connection.connectionStatus = 'inactive';
          connection.sessionStatus = 'inactive';
          connection.isMessageHandlerAttached = false;
        },
        startConnection: function (userId, userPassword,
                                   connectionCallback, options) {
          var jid = userId
            , password = userPassword
            ;
          var deferred = $q.defer();
          connection.onConnectListener = connectionCallback;
          connection.authConfig = {
            username: userId,
            password: userPassword
          };
          connection.deferredBucket.defer_startConnection = deferred;
          try {
            connection.conn = new Strophe.Connection(connection.endpoint);
            connection.conn.addHandler(_onMessageRecv, null, 'message', null, null, null);
            connection.conn.addHandler(_onPresence, null, 'presence');
            connection.conn.connect(jid + '@' + config.HOST, password,
              ConnectionEventListener);
          } catch (e) {
            deferred.reject();
          }
          connection.connectionStatus = 'connecting';
          return deferred.promise;
        },
        //restoreConnection: restoreConnection,
        startDisconnect: function () {
          var deferred = $q.defer();
          if (connection && connection.conn) {
            connection.conn.disconnect();
            connection.sessionStatus = 'inactive';
            connection.deferredBucket.defer_startDisconnect = deferred;
          } else {
            deferred.reject(prepResolution(
              'DISCONNECT',
              'Connection not available..'
            ))
          }
          return deferred.promise;
        }
        ,
        joinRoom: function (roomId, nickName, options) {
          connection.sessionStatus = "starting";
          var deferred = $q.defer();
          var options = options || {};
          var identity = roomId + '@conference.localhost/' + nickName;
          connection.action._tempIdentity = identity;
          connection.action._tempNickname = nickName;
          connection.action._tempRoomId = roomId;
          var presenceReq = $pres({
            to: identity,
            from: connection.conn.jid
          });

          presenceReq
            .c('x', {
              xmlns: 'http://jabber.org/protocol/muc'
            }, null)
            .c('history', {maxstanzas : options.maxstanzas || 200})

            //.c('x',
            //{
            //  xmlns : 'http://jabber.org/protocol/muc'
            //}, null)
            //.c('history', {maxstanzas : 0})
          ;
          connection.sessionStatus = 'isConnecting';
          if (connection.roomInfo) {

          }
          connection.conn.send(presenceReq.tree());
          return deferred.promise;
        }
        ,
        exitRoom: function (roomId, nickName) {
          if (!connection.conn) {
            console.log('no active connections..');
            return;
          }
          connection.sessionStatus = "closing";
          var o = {
            type: 'unavailable',
            to: roomId + '@conference.localhost/' + nickName,
            from: connection.conn.jid
          };

          var m = $pres(o);
          m.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'}, null);
          connection.conn.send(m.tree());
        }
        ,
        sendMessage: function (msg, roomId) {
          var msgTarget = {
            to: roomId + "@conference.localhost",
            type: 'groupchat'
          };
          var msgObj = $msg(msgTarget);
          msgObj.c('body', null, msg);
          connection.conn.send(msgObj.tree());
        }
        ,
        forwardEventToScope: function (scope, key) {
          forwardEventScopes[key] = scope;
        }
        ,
        disConnectScope: function (key) {
          if (forwardEventScopes[key]) {
            forwardEventScopes[key] = null;
            delete(forwardEventScopes[key]);
          }
        }
        ,
        prepareGroupChatMessageJSON: prepareGroupChatMessageJSON,
        parseChatroomHistoryMessage: parseChatroomHistoryMessage,
        identifySender: identifySender
      };

      return api;

      function ConnectionEventListener(status) {
        connectionCallback
        && connectionCallback.onConnectListener
        && connectionCallback.onConnectListener(status);

        var scopeEventName = "ChatService";
        switch (status) {

          case Strophe.Status.CONNECTING:
            connection.connectionStatus = 'connecting';
            scopeEventName += ':' + connection.connectionStatus;
            break;

          case Strophe.Status.CONNECTED:
            connection.connectionStatus = 'connected';
            scopeEventName += ':' + connection.connectionStatus;
            // Start listening for messages on the connection.
            //connection.conn.addHandler(_onMessageRecv, null, 'message', null, null, null);
            //if (!connection.isMessageHandlerAttached) {
            //  connection.isMessageHandlerAttached = true;
            //}
            sendPresence();
            if (connection.deferredBucket.defer_startConnection) {
              connection.deferredBucket.defer_startConnection.resolve(
                prepResolution('CONNECTED')
              )
            }
            break;

          case Strophe.Status.CONNFAIL:
            connection.connectionStatus = 'connfail';
            scopeEventName += ':' + connection.connectionStatus;
            if (connection.deferredBucket.defer_startConnection) {
              connection.deferredBucket.defer_startConnection.reject(
                prepResolution('CONNFAIL', "Connection failed.")
              )
            }
            break;

          case Strophe.Status.AUTHENTICATING:
            connection.connectionStatus = 'authenticating';
            scopeEventName += ':' + connection.connectionStatus;
            break;

          case Strophe.Status.AUTHFAIL:
            if (connection.deferredBucket.defer_startConnection) {
              connection.deferredBucket.defer_startConnection.reject(
                prepResolution('AUTHFAIL', "Authentication failed.")
              )
            }
            scopeEventName += ':authfail';
            break;

          case Strophe.Status.DISCONNECTING:
            connection.connectionStatus = 'disconnecting';
            scopeEventName += ':' + connection.connectionStatus;
            break;

          case Strophe.Status.DISCONNECTED:
            connection.connectionStatus = 'disconnected';

            scopeEventName += ':' + connection.connectionStatus;
            if (connection.deferredBucket.defer_startDisconnect) {
              connection.deferredBucket.defer_startDisconnect.resolve(
                prepResolution('DISCONNECTED')
              )
            }

            if (connection.sessionStatus == 'active') {
              restoreConnection();
            }

            break;

          case Strophe.Status.ATTACHED:
            connection.connectionStatus = 'attached';
            scopeEventName += ':' + connection.connectionStatus;
            break;

          case Strophe.Status.ERROR:
            connection.connectionStatus = 'error';
            scopeEventName += ':' + connection.connectionStatus;
            break;
        }
        console.log(scopeEventName);
        angular.forEach(forwardEventScopes, function (scope) {
          scope.$broadcast(scopeEventName);
        })
      }

      function sendPresence() {
        var presenceObj = {
          from: connection.jid
        };
        connection.conn.send($pres().tree());
      }

      function restoreConnection() {
        console.log('restore connection');
        if (connection.authConfig
          && connection.authConfig.username
          && connection.authConfig.password) {
          var username = connection.authConfig.username
            , password = connection.authConfig.password
            ;

          return api.startConnection(username, password, ConnectionEventListener)
        }
      }

      function _onPresence(presence_xml) {
        var presenceJSON
          , scopeEventName = TAG_NAME + ':presence';
        try {
          presenceJSON = xmlToJson(presence_xml);
          connection.roomInfo = {
            identity: connection.action._tempIdentity,
            nickname: connection.action._tempNickname,
            roomId: connection.action._tempRoomId
          };
          angular.forEach(forwardEventScopes, function (scope) {
            scope.$apply(function () {
              scope.$broadcast(scopeEventName, presenceJSON);
            })
          });
        } catch (e) {

        }
      }

      function _onMessageRecv(msg_xml) {
        connection.sessionStatus = "active";
        connection.roomInfo = {
          identity: connection.action._tempIdentity,
          nickname: connection.action._tempNickname,
          roomId: connection.action._tempRoomId
        };
        var msg = _parseXmlMsg(msg_xml)
          , scopeEventName = "ChatService:message"
          ;
        identifySender(msg);

        switch (msg.type) {
          case 'groupchat':
            scopeEventName = TAG_NAME + ':message';
            break;

          case 'error':
            scopeEventName = TAG_NAME + ':message:error';
            break;

          default:
            scopeEventName = TAG_NAME + ':unknown';
        }
        angular.forEach(forwardEventScopes, function (scope) {
          scope.$apply(function () {
            scope.$broadcast(scopeEventName, msg);
          })
        });

        // -----------------
        //  **IMPORTANT**
        // -----------------
        // Message handler must return true to keep the handler alive.
        // returning false would remove it after it finishes.
        return true;
      }

      function identifySender(msg) {
        if (msg.from == connection.roomInfo.identity) {
          msg._senderType = "SELF";
        } else {
          msg._senderType = "OTHER";
        }
      }

      function identifySenderFromChatHistory(msg) {
        if (msg.from == connection.conn.authzid) {
          msg._senderType = "SELF";
        } else {
          msg._senderType = "OTHER";
        }
      }

      /**
       * Chat Message Format
       *
       * from: From user JID
       * to: To user JID
       * type:
       * timestamp: Timestamp of the message.
       * displayTime: Parsed timestamp. (derived data)
       * _senderType: enum ['SELF', 'OTHER']
       *              identifies the sender as (derived data)
       * groupchat: { ( JSON parsed string.. )
       *    text: Actual display text of the message.
       *    fromUser: message sender display name
       *    fromUserInfo: message sender additional information.
       *    to: message recipient display name
       * }
       *
       */

      function _parseXmlMsg(xml) {
        var msgJSON = {}
          , rawJSON
          ;

        try {
          rawJSON = xmlToJson(xml);

          msgJSON.from = rawJSON.$_attributes.from;
          msgJSON.to = rawJSON.$_attributes.to;
          msgJSON.type = rawJSON.$_attributes.type;
          msgJSON.timestamp = getMessageTimeStampFromStropheMessage(rawJSON);
          msgJSON.displayTime = mobos.Utils.getDisplayDate(msgJSON.timestamp);

          switch (msgJSON.type) {
            case 'groupchat':
              msgJSON.groupchat = _parseGroupChatStropheMessage(rawJSON.body);
              break;
            case 'error':
              msgJSON.error = rawJSON.error;
              var errorNames = [];
              angular.forEach(rawJSON.error, function (err, name) {
                if (name != '$_attributes') {
                  errorNames.push(name);
                }
              });
              msgJSON.error.names = errorNames;
              break;
            default:
          }
        } catch (e) {
        }

        return msgJSON;
      }

      function getMessageTimeStampFromStropheMessage(json) {
        if (json && json.delay) {
          return new Date(json.delay.$_attributes.stamp).getTime();
        } else {
          return new Date().getTime();
        }
      }

      function _parseGroupChatStropheMessage(parsedJSON) {
        var msg = {}
          , messageString
          , messageJSON
          ;
        if (parsedJSON) {
          switch (parsedJSON.formatting) {
            default:
              if (parsedJSON['#text']) {
                try {
                  messageString = parsedJSON['#text'];
                  messageJSON = JSON.parse(messageString);
                  angular.extend(msg, parseGroupChatMessageJSON(messageJSON));
                  msg.text = messageJSON.text || messageString;
                } catch (e) {
                  msg.text = parsedJSON['#text'];
                }
              }
          }
        } else {
          msg.text = "";
        }
        return msg;
      }

      function parseGroupChatMessageJSON(msgJSON) {
        return {
          text: msgJSON.text,
          fromUser: msgJSON.fromUser,
          fromUserInfo: msgJSON.fromUserInfo,
          to: msgJSON.toUser
        }
      }

      function parseChatroomHistoryMessage(msg) {
        var parsedMsg = {
          id: msg.id,
          from: msg.fromJID,
          to: msg.toJID,
          type: "",
          timestamp: msg.sentDate
        };
        try {
          parsedMsg.displayTime = mobos.Utils.getDisplayDate(parsedMsg.timestamp);
          var messageJSON = JSON.parse(msg.body);
          parsedMsg.groupchat = messageJSON;
        } catch (e) {
        }
        identifySenderFromChatHistory(parsedMsg);
        return parsedMsg;
      }

      function prepareGroupChatMessageJSON(text, from, to) {
        var messageJSON = {};
        messageJSON.formatting = "default";
        messageJSON.text = text;
        messageJSON.fromUser = from;
        messageJSON.fromUserInfo = {
          userId: Session.userInfo.id
        };
        messageJSON.to = to;
        return messageJSON;
      }

      function prepResolution(typeCode, msg, data) {
        return {
          type: typeCode,
          msg: msg,
          data: data
        }
      }

    }
  }

  // Changes XML to JSON
  function xmlToJson(xml) {

    // Create the return object
    var obj = {};

    if (xml.nodeType == 1) { // element
      // do attributes
      if (xml.attributes.length > 0) {
        obj["$_attributes"] = {};
        for (var j = 0; j < xml.attributes.length; j++) {
          var attribute = xml.attributes.item(j);
          obj["$_attributes"][attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (xml.nodeType == 3) { // text
      obj = xml.nodeValue;
    }

    // do children
    if (xml.hasChildNodes()) {
      for (var i = 0; i < xml.childNodes.length; i++) {
        var item = xml.childNodes.item(i);
        var nodeName = item.nodeName;
        if (typeof(obj[nodeName]) == "undefined") {
          obj[nodeName] = xmlToJson(item);
        } else {
          if (typeof(obj[nodeName].push) == "undefined") {
            var old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(xmlToJson(item));
        }
      }
    }
    return obj;
  }


})
();