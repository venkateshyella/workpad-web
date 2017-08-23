/**
 * Created by sudhir on 31/8/15.
 */

;
(function () {
	"use strict";

	angular.module('chatter')
		.provider('ChatterConnect', [
			ChatterConnect])
	;

	function ChatterConnect() {
		var options = {
				HOST: 'localhost',
				GROUPCHAT_SERVICE: 'conference.localhost'
			}
			, STATUS = {
				CONNECTED: 1,
				DISCONNECTED: 2,
				CONNECTING: 3,
				DISCONNECTING: 4
			}
			, PRESENCE_TYPE = {
				AVAILABLE: "available",
				UNAVAILABLE: "unavailable"
			}
			;

		return {
			configure: configure,
			$get: ['$rootScope', '$q', '$timeout',
				'AppLogger',
				ChatterConnectFactory]
		};

		function ChatterConnectFactory($rootScope, $q, $timeout, AppLogger) {
			var BROADCAST_TAG = "ChatService"
				;
			StropheConnection.CONNECTION_STATUS = STATUS;
			StropheConnection.PRESENCE_TYPE = PRESENCE_TYPE;
			StropheConnection.utils = {
				parseJID: __parseFromJID
			};
			return StropheConnection;

			function StropheConnection(endpoint, username, password, opts) {
				var self = this
					, _username = this.username = username
					, stropheMessageManager = null
					, _password = password
					, _endpoint = this.endpoint = endpoint
					, _conn = null
					, _options = angular.extend(options, opts || {})
					, _deferBucket = {
						presence: [],
						message: []
					}
					;
				self.status = STATUS.DISCONNECTED;

				self.getConnectionObj = function () {
					return _conn;
				};
				self.connect = connect;
				self.disconnect = disconnect;
				self.sendPresence = sendPresence;
				self.sendBlankPresence = sendBlankPresence;
				self.sendGroupchatMessage = sendGroupchatMessage;
				self.sendDirectMessage = sendDirectMessage;

				function connect() {
					var deferred = $q.defer()
						, jid
						, fullJID
						;
					if (_deferBucket.connect &&
						_deferBucket.connect.status == 'pending') {
						console.log('connect in progress..');
						deferred.reject();
						return deferred.promise;
					} else {
						_deferBucket.connect = {
							deferred: deferred,
							status: 'pending',
							cancelTimeout: $timeout(function () {
								_deferBucket.connect.deferred.reject();
								_deferBucket.connect.status = 'reject';
								//delete(_deferBucket.connect);
							}, 30000)
						};
					}
					console.log(_username + " connecting to: " + _endpoint);
					jid = _username;
					fullJID = jid + '@' + _options.HOST;
					if (_conn) {
						_conn.reset();
					}
					_conn = new Strophe.Connection(_endpoint);
					_conn.addHandler(_onMessageRecv, null, 'message', null, null, null);
					_conn.addHandler(_onPresence, null, 'presence');
					AppLogger.log("New Connection:" + fullJID);
					_conn.connect(fullJID, _password,
						ConnectionEventListener)
					;
					stropheMessageManager = new StropheMessageManager(_conn);

					return deferred.promise;
				}

				function disconnect() {
					console.log('disconnecting from :' + _endpoint);
				}

				function ConnectionEventListener(status) {

					var eventName = "ChatService:";
					switch (status) {

						case Strophe.Status.CONNECTING:
							self.status = STATUS.CONNECTING;
							eventName += 'CONNECTING';
							break;

						case Strophe.Status.CONNECTED:
							self.status = STATUS.CONNECTED;
							_resolvePromiseFromDeferBucket(true, 'connect', this);
							eventName += 'CONNECTED';
							break;

						case Strophe.Status.CONNFAIL:
							self.status = STATUS.DISCONNECTED;
							eventName += 'CONNFAIL';
							_resolvePromiseFromDeferBucket(false, 'connect', this);
							break;

						case Strophe.Status.AUTHENTICATING:
							eventName += 'AUTHENTICATING';
							break;

						case Strophe.Status.AUTHFAIL:
							self.status = STATUS.DISCONNECTED;
							eventName += 'AUTHFAIL';
							_resolvePromiseFromDeferBucket(false, 'connect', this);
							break;

						case Strophe.Status.DISCONNECTING:
							self.status = STATUS.DISCONNECTING;
							eventName += 'DISCONNECTING';
							break;

						case Strophe.Status.DISCONNECTED:
							self.status = STATUS.DISCONNECTED;
							eventName += 'DISCONNECTED';
							break;

						case Strophe.Status.ATTACHED:
							eventName += 'ATTACHED';
							break;

						case Strophe.Status.ERROR:
							this.status = STATUS.DISCONNECTED;
							eventName += 'ERROR';
							break;
					}
					console.log(eventName);
					$timeout(function () {
						$rootScope.$broadcast(eventName);
					}, 0);

					function _resolvePromiseFromDeferBucket(isSuccess, type, result) {
						var _deferred = _deferBucket[type];
						if (_deferred) {
							_deferred.deferred[isSuccess ? 'resolve' : 'reject'](result);
							_deferred.status = 'reject';

						}
					}
				}

				function sendBlankPresence() {
					var deferred = $q.defer();
					var presenceReq = {};
					var $presObj = $pres(presenceReq);

					var pendingPresenceRequest = {
						status: 'pending',
						from: _conn.jid,
						deferred: deferred,
						cancelPromise: $timeout(function () {
							deferred.reject();
							pendingPresenceRequest.status = "rejected";
							cleanDeferBucket(_deferBucket.presence);
						}, 20000)
					};

					_deferBucket.presence.push(pendingPresenceRequest);

					_conn.send($presObj.tree());

					return deferred.promise;

				}

				function sendPresence(roomId, nickName, type, options) {
					var deferred = $q.defer();
					var options = options || {};
					var groupChatIdentity = roomId + '@' + _options.GROUPCHAT_SERVICE + '/' + nickName;
					var presenceType = type || PRESENCE_TYPE.AVAILABLE
						, $presObj
						;
					var pendingPresenceRequest = {
						status: 'pending',
						to: groupChatIdentity,
						chatroomId: roomId,
						nickName: nickName,
						from: _conn.jid,
						deferred: deferred,
						cancelPromise: $timeout(function () {
							deferred.reject();
							pendingPresenceRequest.status = "rejected";
							cleanDeferBucket(_deferBucket.presence);
						}, 20000)
					};
					var presenceReq = {
						to: groupChatIdentity,
						from: _conn.jid
					};

					// Presence acknowledgements are received only
					// for 'available' presence types
					if (presenceType == PRESENCE_TYPE.AVAILABLE) {
						//console.log('pushing new pendingPresenceRequest');
						_deferBucket.presence.push(pendingPresenceRequest);
					} else {
						presenceReq.type = presenceType;
					}

					//console.log("sending presence from: "+_conn.jid+" to:"+identity);
					$presObj = $pres(presenceReq)
						.c('x', {xmlns: 'http://jabber.org/protocol/muc'}, null)
					;

					if (options.history) {
						//console.log(options.history);
						$presObj.c('history', options.history);
					}

					AppLogger.log($presObj.toString());
					_conn.send($presObj.tree());
					return deferred.promise;
				}

				function _onPresence(presence_xml) {
					var presenceJSON
						, presenceAttr
						, eventName = BROADCAST_TAG + ':presence';
					try {
						presenceJSON = mobos.Utils.xmlToJson(presence_xml);
						//console.log('presenceJSON', presenceJSON);
						//console.log('received presence from ', presenceJSON['$_attributes'].from);
						presenceAttr = _getTagAttributes(presenceJSON);

						if (presenceAttr.type == 'error') {
							return;
						}

						// if presence is sent to this connection
						if (presenceAttr.to == _conn.jid) {
							var _params = __parseAddressAttributes(presenceJSON);
							//console.log(_params);
							// check presence defer bucket
							angular.forEach(_deferBucket.presence, function (presenceDefer) {
								if (presenceDefer.chatroomId == _params.from.chatroomId) {
									//console.log('resolving defer');
									presenceDefer.deferred.resolve();
									$timeout.cancel(presenceDefer.cancelTimeout);
									presenceDefer.status = "resolved";
								}
							});
						} else {
						}
						cleanDeferBucket(_deferBucket.presence);
						//console.log(_deferBucket.presence);
						//console.log(presenceJSON);
					} catch (e) {
					}

					// *** VERY IMPORTANT ***
					return true;
					// --------------------//
				}

				function sendDirectMessage(msg, toUserChatId, opts) {
					var deferred = $q.defer()
						, pendingMessage
						, toUserAddress = toUserChatId + '@' + _conn.domain
						;

					var msgMeta = stropheMessageManager.generateMessageMeta(msg);
					var messagePackage = __packageMessage(msg, msgMeta);

					var msgObj = $msg({
							to: toUserAddress,
							type: 'chat'
						})
						.c('body', null, JSON.stringify(messagePackage))
						//.cnode(Strophe.xmlElement('body', messagePackage)).up()
						.c('active', {xmlns: "http://jabber.org/protocol/chatstates"}).up()
						.c('x', {xmlns: "jabber:x:event"})
						.c('delivered').up()
						;

					console.log(msgObj.tree());
					_conn.send(msgObj.tree());

					//pendingMessage = {
					//	status: 'pending',
					//	meta: msgMeta,
					//	deferred: deferred,
					//	cancelPromise: $timeout(function () {
					//		deferred.reject();
					//		pendingMessage.status = "rejected";
					//	}, 20000)
					//};
					//_deferBucket.message.push(pendingMessage);

					//return deferred.promise;
				}

				function sendGroupchatMessage(roomId, msg, opts) {
					var deferred = $q.defer()
						, pendingMessage = null
						;
					try {
						//var msgTarget = {
						//  to: roomId + '@' + _options.GROUPCHAT_SERVICE,
						//  type: 'groupchat'
						//};
						var msgMeta = stropheMessageManager.generateMessageMeta(msg);

						_sendMessageToChatroom(roomId, msg, msgMeta)
							.then(function (result) {
								deferred.resolve(result);
							})
							.catch(function (reason) {
								deferred.reject(reason);
							})
						;
					} catch (e) {
						deferred.reject();
					}
					return deferred.promise;
				}

				function _sendMessageToChatroom(roomId, msg, msgMeta) {
					var msgPackage
						, msgObj
						, msgTarget
						, pendingMessage
						, deferred = $q.defer()
						;
					msgPackage = __packageMessage(msg, msgMeta);
					msgTarget = {
						to: roomId + '@' + _options.GROUPCHAT_SERVICE,
						type: 'groupchat'
					};
					msgObj = $msg(msgTarget);
					msgObj.c('body', null, JSON.stringify(msgPackage));
					_conn.send(msgObj.tree());

					pendingMessage = {
						status: 'pending',
						meta: msgMeta,
						deferred: deferred,
						cancelPromise: $timeout(function () {
							deferred.reject();
							pendingMessage.status = "rejected";
						}, 20000)
					};
					_deferBucket.message.push(pendingMessage);

					return deferred.promise;
				}

				function __packageMessage(msg, msgMeta) {
					return {
						'__meta': msgMeta,
						payload: msg
					}
				}

				function __unPackMessage(msgPackJSON) {
					var msg = null;
					if (msgPackJSON.payload) {
						msg = msgPackJSON.payload;
					} else {
						msg = {}
					}
					return msg;
					//return msgJSON.body || msgJSON;
				}

				function _getTagAttributes(tag) {
					return tag && tag['$_attributes'] || null;
				}

				function cleanDeferBucket(deferBucketArray) {
					//console.log('cleaning up deferBucketArray');
					var completedDeferIndex;
					completedDeferIndex = _.findIndex(deferBucketArray,
						function (pendingDefer) {
							return pendingDefer.status != 'pending';
						});
					while (completedDeferIndex >= 0) {
						deferBucketArray.splice(completedDeferIndex, 1);
						completedDeferIndex = _.find(deferBucketArray);
					}
				}

				function _onMessageRecv(msg_xml) {
					//console.info("recv msg:", msg_xml);
					var msgJSON = null
						, msgBody = null
						, eventName = null
						, msg = null
						, msgAttrs = null
						;
					try {
						msgJSON = mobos.Utils.xmlToJson(msg_xml);
						AppLogger.log(msgJSON);
						msgBody = msgJSON.body['#text'];
						msgBody = JSON.parse(msgBody);
						switch (msgJSON['$_attributes'].type) {
							case 'groupchat':
								eventName = BROADCAST_TAG + ':MESSAGE';
								break;

							case 'chat':
								eventName = BROADCAST_TAG + ':CHAT_MESSAGE';
								break;

							case 'error':
								eventName = BROADCAST_TAG + ':MESSAGE:ERROR';
								break;

							default:
								eventName = BROADCAST_TAG + ':UNKNOWN';
						}

						_findAndResolvePendingMessagesDefer(msgBody);

						msg = __unPackMessage(msgBody);
						msgAttrs = __parseChatroomMessage(msgJSON);
						msg.timestamp = msgAttrs.timestamp;

						$rootScope.$broadcast(eventName, {
							attrs: msgAttrs,
							msg: msg
						});
						cleanDeferBucket(_deferBucket.message);
					}
					catch (e) {
					}

					/**
					 * Find and resolve any pending defers for outgoing messages.
					 * Using meta data 'hash' value of the incoming message to confirm delivery.
					 * @param msgBody
					 */

					// TODO(Sudhir): Use a while loop to clear all the pending defers instead of just one pending defer.
					function _findAndResolvePendingMessagesDefer(msgBody) {
						var pendingDeferIndex = _.findIndex(_deferBucket.message, function (pendingDefer) {
							return pendingDefer.meta.hash == msgBody.__meta.hash;
						});
						if (pendingDeferIndex >= 0) {
							_deferBucket.message[pendingDeferIndex].deferred.resolve(angular.copy(__unPackMessage(msgBody)));
							_deferBucket.message.splice(pendingDeferIndex, 1);
							//console.log('message arrived: "' + msgBody.payload.text + '"');
						}
					}

					return true;
				}

				function __parseAddressAttributes(presenceJSON) {
					var from = presenceJSON['$_attributes'].from
						, to = presenceJSON['$_attributes'].to
						;
					//var match = from.match('^(.*)@(.*)\/(.*)$');
					//match.reverse();
					//match.pop();
					return {
						from: __parseFromJID(from),
						to: to,
						id: ""
					}
				}

				function __parseChatroomJID(JID) {
					var jidMatch = __parseFromJID(JID)
					var serviceName = jidMatch[2]
						, room = jidMatch[1]
						;

				}

				/**
				 * Incoming BOSH message parser.
				 */
				function __parseChatroomMessage(messageJSON) {
					var messageAttrs = __parseAddressAttributes(messageJSON)
						, delayAttrs = null
						;
					if (!messageJSON.delay) {
					}
					else if (angular.isArray(messageJSON.delay)) {
						delayAttrs = _getTagAttributes(messageJSON.delay[0])
					} else {
						delayAttrs = _getTagAttributes(messageJSON.delay)
					}
					messageAttrs.timestamp = (delayAttrs && delayAttrs.stamp)
						|| __newTimestamp();
					//console.log(messageAttrs);
					return messageAttrs;
				}

				function __newTimestamp() {
					console.warn("received message has no valid timestamp. Creating new local timestamp instead");
					return (new Date()).toISOString();
				}
			}
		}

		function __parseFromJID(fromJIDString) {
			var JID_REGEX = '^(.*)@(.*)\/?(.*)$';
			var match = fromJIDString.match(JID_REGEX);
			match.reverse();
			match.pop();
			return {
				chatroomId: match.pop(),
				serviceName: match.pop(),
				nickName: match.pop()
			}
		}

		function configure(opts) {
			angular.extend(options, opts);
		}
	}

	function StropheMessageManager(stropheConnection) {
		var self = this;
		this.conn = stropheConnection;
		return {
			DELAYED_DELIVERY_QUALIFIER: "urn:xmpp:delay",
			LEGACY_DELAYED_DELIVERY_QUALIFIER: "jabber:x:delay",

			generateMessageMeta: function (message) {
				return {
					hash: Math.random().toString(36).substring(2)
				}
			},
			isDiscussionHistoryMessage: function (messageJSON) {
				if (messageJSON.delay &&
					self.getTagQualifier(messageJSON.delay == self.DELAYED_DELIVERY_QUALIFIER)) {

				}
			},
			getTagQualifier: function (tagJSON) {
				return tagJSON['$_attributes'].xmlns;
			}
		}
	}

})();