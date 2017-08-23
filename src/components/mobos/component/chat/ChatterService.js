/**
 * Created by sudhir on 31/8/15.
 */

;
(function () {
	"use strict";

	angular.module('chatter')
		.provider('ChatterService', [ChatterServiceProvider])
	;

	/**
	 * Chatter service provides apis for managing
	 * a multi user chat system on the client side.
	 *
	 * Features:
	 * - XMPP messaging system. (Send and receive messages.)
	 * - Multi-user chatrooms.
	 * - Message history.
	 */

	function ChatterServiceProvider() {
		var config = {};

		return {
			configure: configure,
			$get: ['$q', '$rootScope', 'DataProvider', 'ChatterConnect',
				'AppLogger', 'Session',
				'Connect', 'URL','Securify',
				'CHAT_ENCRYPT_TYPE',
				ChatterServiceFactory]
		};

		function configure(config) {
		}

		function ChatterServiceFactory($q, $rootScope
			, DataProvider, ChatterConnect
			, AppLogger, Session
			, Connect, URL, Securify
			, CHAT_ENCRYPT_TYPE) {
			var _options = {}
				, stropheConnection = null
				, stropheConnectionConfig = {}
				, omq = []
				, activeChatSessions = []
				, activeProcesses = {}
				, targetState = {}
				, chatRoomEncKey = ""
				;
			return {
				initialize: initialize,
				outgoingMessage: outgoingMessage,
				readyConnection: readyConnection,
				readyChatroom: readyChatroom,
				readySingleChatSession: readySingleChatSession,
				leaveChatroom: leaveChatroom,
				fetchOlderChatroomMessages: fetchOlderChatroomMessages,
				sendMessageToChatroom: sendMessageToChatroom,
				getSingleChatSessionMessageSender: getSingleChatSessionMessageSender,
				waitForChatroomMessages: waitForChatroomMessages,
				flushOMQ: flushOMQ,
				restoreConnection: null
			};

			function initialize(endpoint, authConfig, options) {
				angular.extend(_options, options || {});

				stropheConnectionConfig.endpoint = endpoint;
				stropheConnectionConfig.username = authConfig.username;
				stropheConnectionConfig.password = authConfig.password;

				stropheConnection = new ChatterConnect(
					stropheConnectionConfig.endpoint,
					stropheConnectionConfig.username,
					stropheConnectionConfig.password);

				_setupChatMessageListener();
				_setupConnectionListener();

				return this;

				function _setupChatMessageListener() {

					$rootScope.$on('ChatService:MESSAGE', function (event, data) {
						//console.log(data);
						var message = data;
						_processIncomingGroupChatMessage(message)
					});

					$rootScope.$on('ChatService:CHAT_MESSAGE', function (event, data) {
						//console.log(data);
						var message = data;
						_processIncomingChatMessage(message)
					});

				}

				function _setupConnectionListener() {
					$rootScope.$on('ChatService:CONNECTING', function (event, data) {
					});

					$rootScope.$on('ChatService:CONNECTED', function (event, data) {
						_restoreActiveChatSessions()
							.then(function () {
								flushOMQ();
							})
							.catch(function () {
							})
							.finally(function () {
							})
						;
					});

					$rootScope.$on('ChatService:DISCONNECTED', function (event, data) {
						_handleConnectionDrop();
					});
				}
			}

			/**
			 * Fetch 'count' messages in a given chatroom that are older than a given timestamp.
			 * @param chatroomId Id of the chatroom.
			 * @param oldestMessageTimestamp Oldest message timestamp.
			 * @param count Number of messages to be fetched.
			 */
			function fetchOlderChatroomMessages(chatroomId, count, oldestMessageTimestamp) {
				var deferred = $q.defer()
					, oldestMessageTimestamp = oldestMessageTimestamp || (new Date()).toISOString()
					;
				/*
				 1. Load messages from chatroom store.
				 2. If messages available, resolve
				 3. Else fetch new messages from server.

				 */

				_loadStoreMessages(chatroomId, oldestMessageTimestamp, count)
					.then(function (res) {
						if (res.length > 0) {
							//console.log(res);
							res = _decryptChatHistoryMessageText(res);
							deferred.resolve(res);
						} else {
							// pull fresh messages from server
							_fetchChatHistory(chatroomId, oldestMessageTimestamp, count)
								.then(function (res) {
									//console.log(res);
									_loadStoreMessages(chatroomId, oldestMessageTimestamp, count)
										.then(function (res) {
										    res = _decryptChatHistoryMessageText(res);
											deferred.resolve(res);
										})
								})
								.catch(function (err) {
									deferred.reject(err);
								})
						}
					});

				return deferred.promise;

				function _loadStoreMessages(chatroomId, timestamp, count) {
					//console.log(timestamp);
					return DataProvider.resource.ChatMessage.findAll({
						where: {
							_chatroomId: {
								'==': chatroomId
							},
							timestamp: {
								'<': timestamp
							}
						},
						orderBy: [['timestamp', 'DESC']],
						//offset: $scope.messageStack.length,
						limit: count
					}, {bypassCache: true})
				}

				function _fetchChatHistory(chatroom, timestamp, count) {
					var timeInMilliSec = new Date(timestamp).getTime();
					return Connect.get(URL.CHAT_HISTORY, {
							chatroomId: chatroomId,
							lastMessageTime: timeInMilliSec,
							pageSize: count
						})
						.then(function (res) {
							var messageArray = _parseChatHistoryMessage(res.resp.messages)
								, createDeferList = []
								, totalMessageCount = res.resp.totalMessagesCount
								;
							angular.forEach(messageArray, function (msg) {
								createDeferList.push(DataProvider.resource.ChatMessage.create(msg));
							});
							return $q.all(createDeferList);
						})
				}

				function _parseChatHistoryMessage(chatHistoryMessages) {
					var messageList = []
						, _msgModel
						, _msgBody
						, _msgAdressAttrs
						;

					angular.forEach(chatHistoryMessages, function (rec) {
						_msgBody = JSON.parse(rec.body);
						_msgModel = angular.copy(_msgBody.payload || _msgBody);
						_msgAdressAttrs = ChatterConnect.utils.parseJID(rec.toJID);
						_msgModel._chatroomId = _msgAdressAttrs.chatroomId;
						_msgModel.receipt = true;
						_msgModel.timestamp = new Date(rec.sentDate).toISOString();
						messageList.push(angular.copy(_msgModel))
					});

					//console.log(messageList);

					return messageList;
				}
			}

			function _decryptChatHistoryMessageText(messagesList){
				for(var i = 0; i< messagesList.length; i++ ){
					var msg = messagesList[i];
					if(msg.wp){
						try{
						var encryptVersion = msg.wpType ? msg.wpType : CHAT_ENCRYPT_TYPE.KEY;
						if(chatRoomEncKey){
							msg.text = Securify.decryptWithKey(msg.text, encryptVersion, chatRoomEncKey);	
						}else{
							msg.text = Securify.decrypt(msg.text, encryptVersion);
						}
						}catch(err){
							console.log("Error in _decryptChatHistoryMessageText: "+err);
							continue;
						}
						
					}
				}
				
				return messagesList;
			}

			
			function _handleConnectionDrop() {
				if (targetState.connected) {
					readyConnection()
						.then(function () {
							_restoreActiveChatSessions()
								.then(function () {
									console.log('all chatrooms connected');
								})
							;
						})
						.catch(function () {
						})
						.finally(function () {
						})
					;
				}
			}

			function _restoreActiveChatSessions() {
				var deferredArray = [];
				angular.forEach(activeChatSessions, function (chatSession) {
					deferredArray.push(
						readyChatroom(chatSession.roomId, chatSession.nickname));
				});
				return $q.all(deferredArray);
			}

			function sendMessageToChatroom(chatroomId, msg, options) {

				var deferred = $q.defer();
				// 1. Get chatroom store.
				readyChatStore(chatroomId)
				//.then(function(chatroom) {return chatroom})
					.then(function (chatroom) {
						/**
						 * encrypting the chat text messages
						 */
					   // msg = _checkAndEncryptChatMesssge(msg);
						  
						//msg._chatroomId = chatroomId;
						DataProvider.resource.ChatMessage.create(msg)
							.then(function (msgModel) {

								// 2. Write message to OMQ
								omq.push({
									chatroomId: chatroomId,
									id: msgModel.id,
									msg: msgModel,
									options: options,
									deferred: deferred
								});
							})
							.then(function (msgModel) {
								// 3. Flush OMQ
								flushOMQ();
							})
						;

						// 2. Write message to OMQ
						//omq.push({
						//  chatroomId: chatroomId,
						//  id: "",
						//  msg: msg,
						//  options: options,
						//  deferred: deferred
						//});

						// 3. Flush OMQ
						//flushOMQ();
					})
				;
				console.log(omq);


				return deferred.promise;
			}

			function readyChatStore(chatroomId) {
				var deferred = $q.defer();

				DataProvider.resource.Chatroom.find(chatroomId)
					.then(function (chatroomModel) {
						deferred.resolve(chatroomModel);
					})
					.catch(function () {
						_createNewChatroom(chatroomId)
							.then(function (chatroomModel) {
								deferred.resolve(chatroomModel);
							})
							.catch(function (reason) {
								deferred.reject(reason);
							})
							.finally(function () {
							})
					})
				;

				return deferred.promise;

				function _createNewChatroom(chatroomId) {
					return DataProvider.resource.Chatroom.create({
						id: chatroomId
					});
				}
			}

			function getSingleChatSessionMessageSender(toUserChatId) {
				var currUserChatroomId = Session.userInfo.chatroomId
					, targetUserChatroomId = toUserChatId;
				var chatroomId = _prepareChatroomIdForDirectMessages(
					currUserChatroomId, targetUserChatroomId
				);
				return {
					sendMessage: function sendMessage(messageObj) {

						// @formatter:off
						/*
						* <message to='romeo@montague.net' id='message22'>
							  <body>Art thou not Romeo, and a Montague?</body>
							  <x xmlns='jabber:x:event'>
								  <offline/>
								  <delivered/>
								  <displayed/>
								  <composing/>
							  </x>
						  </message>
						* */
						// @formatter:on

						return stropheConnection.sendDirectMessage(messageObj, toUserChatId)
					}
				}
			}

			function _prepareChatroomIdForDirectMessages(chatroomId1, chatroomId2) {
				return chatroomId1 < chatroomId2
					? chatroomId1 + "-" + chatroomId2
					: chatroomId2 + "-" + chatroomId1
					;
			}

			function readySingleChatSession(fromUserId, toUserId) {
				var deferred = $q.defer()
					, presenceConfig
					;
				readyConnection()
					.then(function () {
						stropheConnection.sendBlankPresence()
							.then(function () {
								console.log("sent blank response");
								deferred.resolve();
							})
					});

				return deferred.promise;
			}

			function readyChatroom(chatroomId, nickname, options) {
				var deferred = $q.defer()
					, presenceConfig
					;
				
				if(options && options.params.chatRoomEncKey){
					chatRoomEncKey = options.params.chatRoomEncKey;
				}
				
				function execPostChatConnect(){
					readyConnection()
						.then(function () {
							var presenceConfig = {};
							readyChatStore(chatroomId)
								.then(function (chatroom) {
									if (chatroom.$_latestMessage && chatroom.$_latestMessage.timestamp) {
										presenceConfig.history = {
											'since': chatroom.$_latestMessage.timestamp
											//'since': '2015-09-06T16:00:00.000Z'
										};
										AppLogger.log('getting fresh message from: ' +
											mobos.Utils.getDisplayTime(presenceConfig.history.since));
									} else {
										AppLogger.log('No latest message found or no timestamp found in the latest message..');
										console.log(chatroom.$_latestMessage);
										presenceConfig.history = {
											//'maxstanzas': 20
											'maxchars': 0
										};
									}
									return _sendChatroomPresence(chatroomId, nickname, {
										presenceConfig: presenceConfig
									});
								})
						})
						.then(function () {
							activeChatSessions.push({
								roomId: chatroomId,
								nickname: nickname,
								msgWaiteeList: []
							});
							deferred.resolve();
						})
						.catch(function () {
							deferred.reject();
						})
					;
					
				}
			
				execPostChatConnect();
				
				
				return deferred.promise;
			}

			function leaveChatroom(chatroomId) {
				var deferred = $q.defer();
				console.log('leaving chatroom: ' + chatroomId);
				chatRoomEncKey = "";
				_sendChatroomExit(chatroomId)
					.then(function () {
						deferred.resolve();
					})
					.catch(function () {
						deferred.reject();
					})
					.finally(function () {
						_.remove(activeChatSessions, function (chatSession) {
							return chatSession.roomId == chatroomId;
						})
					})
				;
				return deferred.promise;
			}

			function _sendChatroomPresence(chatroomId, nickname, options) {
				var deferred = $q.defer()
					, options = options || {}
					;

				stropheConnection.sendPresence(chatroomId, nickname,
					ChatterConnect.PRESENCE_TYPE.AVAILABLE, options.presenceConfig)
					.then(function (result) {
						$rootScope.$broadcast('ChatService:JOIN_ROOM', {
							chatroomId: chatroomId,
							nickName: nickname
						});
						deferred.resolve(result);
					})
					.catch(function (reason) {
						deferred.reject(reason)
					})
				;

				return deferred.promise;
			}

			function _sendChatroomExit(chatroomId) {
				var deferred = $q.defer()
					;
				var activeChatSession = _.find(activeChatSessions, function (chatSession) {
					return chatSession.roomId == chatroomId
				});
				if (!activeChatSession) {
					deferred.reject();
					return deferred.promise;
				}
				stropheConnection.sendPresence(activeChatSession.roomId, activeChatSession.nickname,
					ChatterConnect.PRESENCE_TYPE.UNAVAILABLE);

				_.remove(activeChatSessions, function (chatSession) {
					return chatSession.roomId == chatroomId;
				});

				deferred.resolve();

				return deferred.promise;
			}

			function readyConnection() {
				var deferred = $q.defer();
				targetState.connected = true;
				if (stropheConnection.status == ChatterConnect.CONNECTION_STATUS.CONNECTED) {
					console.log('already connected');
					deferred.resolve(stropheConnection);
				} else {
					console.log('creating new connection');
					stropheConnection.connect()
						.then(function () {
							deferred.resolve(stropheConnection);
						})
						.catch(function (reason) {
							deferred.reject(reason);
						})
					;
				}
				return deferred.promise;
			}

			function flushOMQ() {
				var deferred = $q.defer()
					;
				if (activeProcesses.flush) {
					console.log("OMQ flush in progress...");
					deferred.reject();
				} else {
					console.log("flushing OMQ...");
					activeProcesses.flush = true;
					__sendTop();
				}
				return deferred.promise;

				function __sendTop() {
					if (omq.length > 0) {
						var omq_top = omq[0]
							, chatroomId = omq_top.chatroomId
							, msg = omq_top.msg
							, options = omq_top.options
							;
						//console.log("sending OMQ top: " + omq_top.msg.text);
						omq_top.status = "pending";

						stropheConnection.sendGroupchatMessage(chatroomId, msg)
							.then(function (result) {
								omq_top.status = 'sent';
								omq_top.deferred.resolve(result);
								omq.splice(0, 1);
								_removeSentMessagesFromOMQ();
								__sendTop();
							})
							.catch(function (reason) {
								omq_top.status = 'pending';
								omq_top.deferred.reject(reason);
								activeProcesses.flush = false;
								deferred.reject(reason);
							})
							.finally(function () {
								_removeSentMessagesFromOMQ();
								//console.log(omq);
							})
						;
					} else {
						console.log("Empty OMQ");
						activeProcesses.flush = false;
						deferred.resolve();
					}
				}
			}

			function _removeSentMessagesFromOMQ() {
				var sentMessageIndex;
				sentMessageIndex = _.findIndex(omq, function (om) {
					return om.status == 'sent'
				});
				while (sentMessageIndex >= 0) {
					omq.splice(sentMessageIndex, 1);
					sentMessageIndex = _.findIndex(omq, function (om) {
						return om.status == 'sent'
					});
				}
			}

			function _processIncomingGroupChatMessage(message) {

				// 1. get chatroom id.
				var chatroomId
					, from
					, data = message.msg
					, attrs = message.attrs
					;
				from = attrs.from;
				chatroomId = from.chatroomId;
				// 2. get chatroom
				readyChatStore(chatroomId)
					.then(function (chatroom) {
						// 3. insert/update message in chatroom.
						data.receipt = true;
						data._chatroomId = chatroomId;
						//console.log(chatroom);
						return DataProvider.resource.ChatMessage.create(data)
							.then(function (messageModel) {
								//if(chatroom.$_latestMessage) {
								//  var lastMessageDateTime = new Date(chatroom.$_latestMessage.timestamp)
								//    , newMessageDateTime = new Date(messageModel.timestamp)
								//    ;
								//  if(lastMessageDateTime <= newMessageDateTime) {
								//    //console.log('newer message arrived.. '+messageModel+' in chatroom:'+chatroom.id);
								//    //chatroom.latestMessage = data;
								//    DataProvider.resource.Chatroom.create(chatroom);
								//  }
								//} else {
								//  //chatroom.latestMessage = data;
								//  DataProvider.resource.Chatroom.create(chatroom);
								//}
								return messageModel;
							});
					})
					.then(function (chatMessage) {
						// 4. notify waitee.
						//console.log(chatMessage);
						angular.forEach(activeChatSessions, function (chatSession) {
							__notifyChatroomWaitee(chatSession, chatMessage);
						});
						return chatMessage;
					})
					.catch(function () {
					})
					.finally(function () {
					})
				;


				function __notifyChatroomWaitee(chatSession, chatMessage) {
					angular.forEach(chatSession.msgWaiteeList, function (waitee) {
						chatMessage = _checkAndProcessIncomingMessageDecryption(chatMessage);
						waitee.deferred.notify(chatMessage);
					})
				}
			}

			function _processIncomingChatMessage(msg) {
				console.log(msg);



			}
			
			function _checkAndProcessIncomingMessageDecryption(message){
				if(message.wp){
					var encryptVersion = message.wp ? message.wpType : CHAT_ENCRYPT_TYPE.KEY;
					if(chatRoomEncKey){
						message.text = Securify.decryptWithKey(message.text, encryptVersion, chatRoomEncKey);	
					}else{
						message.text = Securify.decrypt(message.text, encryptVersion);
					}
					
				}
				return message;
				//return Securify.decrypt(messageText, 'kef');
			}
			
			function _checkAndEncryptChatMesssge(message){
				message.wp = true;
				message.wpType = CHAT_ENCRYPT_TYPE.KEY;
				if(chatRoomEncKey){
					message.text = Securify.encryptWithKey(message.text, CHAT_ENCRYPT_TYPE.KEY, chatRoomEncKey);
				}else{
					message.text = Securify.encrypt(message.text, CHAT_ENCRYPT_TYPE.KEY);
				}
				return message;
				//return Securify.encrypt(messageText, 'kef');
			}


			/**
			 * Use promise notify api to notify waitee about arrival of a new message to a chatroom
			 *
			 * @param chatroomId
			 * @returns {Object}
			 * - deferred promise Object.
			 * - Destroy function that removes the saved defer object.
			 */
			function waitForChatroomMessages(chatroomId) {
				var deferred = $q.defer()
					, activeSession
					, _waiteeUid
					;
				activeSession = _.find(activeChatSessions, function (chatSession) {
					return chatSession.roomId == chatroomId
				})

				if (activeSession) {
					_waiteeUid = mobos.Utils.nextUid();
					activeSession.msgWaiteeList.push({
						id: _waiteeUid,
						deferred: deferred
					})
				}

				return {
					promise: deferred.promise,
					destroy: function () {
						if(activeSession && activeSession.msgWaiteeList){
							var waiteeIndex = _.findIndex(activeSession.msgWaiteeList, function (waitee) {
								return waitee.id == _waiteeUid
							})
							if (waiteeIndex >= 0) {
								activeSession.msgWaiteeList.splice(waiteeIndex, 1);
							}
						}
						
					}
				};
			}

			function outgoingMessage(msg) {
				return {
					_status: 'pending',
					msg: msg
				}
			}
			
			function getChatProfile(params){
				var deferred = $q.defer()
				, _params = {};
				
				params = params || $rootScope.chatProfParams;
				_params.catId = params.catId;
				_params.catType = params.catType; 
				
				if(params.threadId){
					_params.threadId = params.threadId;
				}
				
				Connect.get(URL.CHAT_PROFILE,_params).then(function(res){
					chatRoomEncKey = res.chatRoomKey;
					deferred.resolve();
				}, function(error){
					deferred.resolve();
				});
				
				delete $rootScope.chatProfParams;
				
				return deferred.promise;
			}

		}

	}

})();