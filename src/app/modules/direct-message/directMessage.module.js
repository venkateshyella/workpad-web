/**
 * Created by sudhir on 19/1/16.
 */

angular.module('app')
	.provider('DirectMessaging', [function () {

		return {
			$get: [
				'$q', '$timeout',
				'mDialog', 'AppCoreUtilityServices',
				'Lang', 'Connect', 'URL','blockUI',
				DirectMessageService
			]
		};

		function DirectMessageService($q, $timeout, Dialog
			, AppCoreUtilityServices
			, Lang, Connect, URL, blockUI) {
			"use strict";

			var LANG = Lang.en.data;

			return {
				messageSenderFactory: messageSenderFactory,
				loadMessages: function () {
					return _loadMessages();
				},
				loadTopics: function () {
					return _loadtopicsList();
				},
				runSendMessageWorkflow: runSendMessageWorkflow,
				sendMessagesViewWorkflow : sendMessagesViewWorkflow,
				loadPingTopicsList : _loadtopicsList
			};

			function runSendMessageWorkflow(topicId, toUserId, config) {
				var deferred = $q.defer();
				var _config = angular.extend({}, config, {
					topicId: topicId,
					toUserId: toUserId
				});

				// Set default value for sending message in a new topic.
				if (topicId == null) {
					_config.topicId = 0;
				}

				Dialog.show({
						templateUrl: "app/modules/direct-message/template/direct-message.dialog.view.html",
						 clickOutsideToClose: false,
						controller: ['$scope', '$q', '$mdDialog',
							MessageSenderDialogController
						]
					})
					.then(function (res) {
						deferred.resolve(res)
						Dialog.alert(res.respMsg);
					})
					.catch(function (reason) {
						deferred.reject(reason);
					});

				return deferred.promise;

				function MessageSenderDialogController($scope, $q, $mdDialog) {

					var messageSender = messageSenderFactory(_config.topicId, _config.toUserId);
					var userIconURLBuilder = AppCoreUtilityServices.AuthUrlBuilder(URL.GET_PIC, {
						imgEntityType: "USER",
						imgType: "ICON",
						hash: mobos.Utils.imgHashCounter
					});

					angular.extend($scope, {
						cancel: $mdDialog.cancel,
						onMessageTextChange: function () {
							$scope.FLAG.send_failed = false;
						},
						sendMessage: function () {
							console.log('sending message: ', $scope.msgText, _config.toUserId);
							//if (validateMessage($scope.msgText)) {
							//	$scope.FLAG.send_failed = true;
							//	$scope.send_errMsg = LANG.DIRECT_MESSAGE.ERROR.MESSAGE_MAX_LENGTH;
							//	return;
							//}
							$scope.FLAG.send_inProgress = true;
							$scope.FLAG.send_failed = false;
							messageSender.sendMessage($scope.msgText)
								.then(function (res) {
									$mdDialog.hide(res);
								})
								.catch(function (err) {
									$scope.FLAG.send_failed = true;
									$scope.send_errMsg = err.respMsg;
									return err;
								})
								.finally(function () {
									$scope.FLAG.send_inProgress = false;
								});
						},
						loadMessages: function (params) {
							if (_config.topicId)
								$scope.FLAG.loadMessages_inProgress = true;
							_loadMessages(_config.topicId, params)
								.then(function (messages) {
									$scope.topicMessagesList = messages;
								})
								.finally(function () {
									$scope.FLAG.loadMessages_inProgress = false;
								});
						},
						msgText: null,
						sendButtonText: LANG.BUTTON.SEND,
						topicMessagesList: [],
						title: LANG.DIRECT_MESSAGE.LABEL.TITLE_DIRECT_MESSAGE,
						triggerInputFocus: false,
						FLAG: {
							send_inProgress: false,
							loadMessages_inProgress: false
						},
						userImageURL: function (userId) {
							return userIconURLBuilder({
								entityId: userId
							});
						},
						displayDate: function(date) {
							return AppCoreUtilityServices.getDisplayDate_DDMMYYYYHHMMSS(date);
						}
					});

					if (_config.fetchOlderTopicMessages && _config.topicId > 0) {
						$scope.loadMessages();
					}

					$timeout(function () {
						$scope.triggerInputFocus = true;
					}, 300)
					
					
					$scope.addScrollToPingList = function(){
						$('md-dialog-content' ).addClass('chat-content-scroll');
						var elem = $('md-dialog-content' );
						var topPos = elem[0].scrollHeight;//elem.offset().top + elem.height();
						console.log("topPostopPostopPostopPos "+elem[0].scrollHeight+" ...topPos "+topPos+"..elem.offset().top..."+elem.offset().top);
						$('md-dialog-content' ).scrollTop(topPos+120);
					};
					
				}
			}

			
			function sendMessagesViewWorkflow() {
				var deferred = $q.defer();
				
				Dialog.show({
						templateUrl: "app/modules/direct-message/template/direct-messages-view.dialog.view.html",
						 clickOutsideToClose: false,
						controller: ['$scope', '$q', '$mdDialog',
						             MessagesViewDialogController
						]
					})
					.then(function (res) {
						deferred.resolve(res);
						Dialog.alert(res.respMsg);
					})
					.catch(function (reason) {
						deferred.reject(reason);
					});

				return deferred.promise;

				function MessagesViewDialogController($scope, $q, $mdDialog) {
					$scope.messages = {
							topicList: [],
							pgInfo: {
								pageSize: 25,
								currPage: 1
							}
					};	
					$scope.isPingView = false;
					$scope.isNextPageAvailable = false;
	    			$scope.loadingNext = false;
	    			
					$scope.cancel = function () {
						$mdDialog.cancel();
					}
					$scope.toggleList = function(){
						$scope.messages = {
								topicList: [],
								pgInfo: {
									pageSize: 25,
									currPage: 1
								}
						};	
						$scope.isPingView = false;
						$scope.isNextPageAvailable = false;
		    			$scope.loadingNext = false;
						loadTopics();	
					}
					
					function loadTopics() {
						blockUI.start("Loading...", {
							status: 'isLoading'
						});
						var _params = {
								pageSize: $scope.messages.pgInfo.pageSize,
								pageNumber: $scope.messages.pgInfo.currPage,
						};
						_loadtopicsList(_params).then(function (res) {
							if (res.isSuccess) {
								angular.forEach(res.resp.results, function(value, key) {
									$scope.messages.topicList.push(value);
								});
							}
							checkNextPgAvailability(res.resp.paginationMetaData.totalResults);
						}).catch(function (err) {
							Dialog.alert({
								content: err.respMsg,
								ok: "Ok"
							});
						}).finally(function () {
							blockUI.stop();
						});
					}
					function checkNextPgAvailability(resultCount) {
	    				if ($scope.messages.topicList.length < resultCount) {
	    					$scope.isNextPageAvailable = true;
	    				} else {
	    					$scope.isNextPageAvailable = false;
	    				}
	    				$scope.loadingNext = false;
	    			}
					$scope.loadNext = function() {
	    				$scope.loadingNext = true;
	    				$scope.messages.pgInfo.currPage += 1;
	    				loadTopics();
	    			}
					
					loadTopics();
					$scope.displayDate = function(date) {
						return AppCoreUtilityServices.getDisplayDate_DDMMYYYYHHMMSS(date);
					}
					$scope.clickOnTopic =  function(topicId, userId){
						$scope.isPingView = true;
						var _config = {
							topicId: topicId,
							toUserId: userId
						};
						// Set default value for sending message in a new topic.
						if (topicId == null) {
							_config.topicId = 0;
						}
						
						var messageSender = messageSenderFactory(_config.topicId, _config.toUserId);
						angular.extend($scope, {
							onMessageTextChange: function () {
								$scope.FLAG.send_failed = false;
							},
							sendMessage: function () {
								console.log('sending message: ', $scope.msgText, _config.toUserId);
								$scope.FLAG.send_inProgress = true;
								$scope.FLAG.send_failed = false;
								messageSender.sendMessage($scope.msgText)
									.then(function (res) {
										$mdDialog.hide(res);
									})
									.catch(function (err) {
										$scope.FLAG.send_failed = true;
										$scope.send_errMsg = err.respMsg;
										return err;
									})
									.finally(function () {
										$scope.FLAG.send_inProgress = false;
									});
							},
							loadMessages: function (params) {
								if (_config.topicId)
									$scope.FLAG.loadMessages_inProgress = true;
								_loadMessages(_config.topicId, params)
									.then(function (messages) {
										$scope.topicMessagesList = messages;
									})
									.finally(function () {
										$scope.FLAG.loadMessages_inProgress = false;
									});
							},
							msgText: null,
							sendButtonText: LANG.BUTTON.SEND,
							topicMessagesList: [],
							title: LANG.DIRECT_MESSAGE.LABEL.TITLE_DIRECT_MESSAGE,
							triggerInputFocus: false,
							FLAG: {
								send_inProgress: false,
								loadMessages_inProgress: false
							}
						});

						$scope.loadMessages();
						
						$timeout(function () {
							$scope.triggerInputFocus = true;
						}, 300)
						
						$scope.addScrollToPingList = function(){
							if ($scope.isPingView) {
								$('md-dialog-content' ).addClass('chat-content-scroll');
								var elem = $('md-dialog-content' );
								var topPos = elem[0].scrollHeight;//elem.offset().top + elem.height();
								console.log("topPostopPostopPostopPos "+elem[0].scrollHeight+" ...topPos "+topPos+"..elem.offset().top..."+elem.offset().top);
								$('md-dialog-content' ).scrollTop(topPos+120);
							} else {
								$('md-dialog-content' ).removeClass('chat-content-scroll');
							}
						};
						
					}
			
				}
			}
			
			function validateMessage(message) {
				return message && message.length > 200;
			}

			function messageSenderFactory(topicId, toUserId) {
				var _config = {
					topicId: topicId,
					toUserId: toUserId
				};

				return {
					sendMessage: function (messageString) {
						return _sendMessage(_config.topicId, _config.toUserId, messageString);
					}
				}

			}

			function _sendMessage(topicId, toUserId, messageString) {
				var url = URL.DM_SEND_MESSAGE;
				var params = {
					toUser: toUserId,
					message: messageString
				};
				if (topicId) {
					params.topicId = topicId
				}
				return Connect.post(url, params);
			}
			

			function _loadMessages(topicId) {
				var deferred = $q.defer();
				Connect.get(URL.DM_GET_ALL_MESSAGES, {
						topicId: topicId
					})
					.then(function (res) {
						if (res.isSuccess && res.resp && res.resp.msgs) {
							deferred.resolve(res.resp.msgs);
						} else {
							deferred.reject(res);
						}
					})
					.catch(function (err) {
						deferred.reject(err);
					});
				return deferred.promise;
			}

			function _loadtopicsList(params) {
				var deferred = $q.defer();
				Connect.get(URL.DM_GET_ALL_MESSAGE_TOPICS,params)
					.then(function (res) {
						if (res.isSuccess) {
							deferred.resolve(res);
						} else {
							deferred.reject(res);
						}
					})
					.catch(function (err) {
						deferred.reject(err);
					}).finally(function () {
						
					});
				return deferred.promise;
			}

		}

	}]);