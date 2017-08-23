/**
 * Created by rihdus on 29/4/15.
 */

;
(function () {

	angular.module('app')
		.controller('AppMasterController', AppMasterController);

	function AppMasterController($scope, $rootScope,State, $q, $stateParams, $timeout, Session,
	                             ServiceRunner, $mdSidenav, $mdUtil,
	                             DataProvider, blockUI, Dialog, $mdToast,
	                             Connect, PushNotificationService,
	                             ChatterService,
	                             APP_DATA_CSS, Lang, APP_INFO, APP_BROADCAST, DEFAULT_ENDPOINT, BOSH_ENDPOINT, URL,
	                             PUSH_NOTIFICATION_TYPE, AuthService, SESSION_PSWD,
	                             MEETING_VIEW_EVENTS, ConferenceService, AppCoreUtilityServices,
	                             MEETING_TYPES, CATEGORY_TYPE, MEETING_CUSTOM_COMMANDS, CONFERENCE_BROADCAST,
	                             meetingService, MEETING_EVENT_TYPES) {

		var _chatterOptions, _chatterAuthConfig;
		var self = this;
		var LANG = Lang.en.data;
		var deregisterNotificationListener = null;

		//--- Should only be exposed during development
		window.Connect = Connect;
//		window.URL = URL;	
		//------------------------
		// master scope intialize
		$scope.LANG = Lang.en.data;
		$scope.APP_DATA_CSS = APP_DATA_CSS;
		$scope.sharedData = {
			user: {},
			sideMenu: {
				currItem: 'dashboard'
			}
		};
		$scope.session = Session;
		$scope.userDisplayName = $scope.session.userInfo.userFirstName+" "+$scope.session.userInfo.userLastName;
		
		$scope.DEFAULT_ENDPOINT = DEFAULT_ENDPOINT;
		$scope.showHeaderDropdown = false;
		$scope.showMeetingOpts = true;

		$rootScope.toolbarLoader = {
			async_active: false
		};

		/**
		 * To Apply scrolling to list displayed in 
		 * tab sections
		 */
		$rootScope.addScrollToList = function(){
			$(".tab-list-scroll").addClass('layout-content-scroll');
			$('row[layout-gravity="free"]' ).removeAttr('style');
			$('row[layout-gravity="free"]' ).removeClass('layout-content-scroll');
		};
		
		/**
		 * To Apply scrolling to list displayed in 
		 * chat view sections
		 */
		$rootScope.addScrollToChatList = function(){
			$('row[layout-gravity="free"]' ).removeAttr('style');
			$('row[layout-gravity="free"]' ).removeClass('layout-content-scroll');
			$('row[layout-gravity="free"]' ).addClass('chat-content-scroll');
			
			var elem = $('row[layout-gravity="free"]' );
			var topPos = elem[0].scrollHeight;//elem.offset().top + elem.height();
			//console.log("topPostopPostopPostopPos "+elem[0].scrollHeight+" ...topPos "+topPos+"..elem.offset().top..."+elem.offset().top);
			$('row[layout-gravity="free"]' ).scrollTop(topPos+120);
			
			var winH = $(window).height();
			 var headH = $('#headerNavId').height(); 
			 var textAH = $('.chatListFooter').height();
			 var conH = winH-headH-textAH-100;
			 $('row[layout-gravity="free"]').css("height",conH+"px");
		};
		
		
		 $rootScope.$on('$stateChangeStart', function (event, toState, toParams
                 , fromState, fromParams) { 
			     
			 	  addMainSectionScroll(); 
				  scrollToTop();
		 });
		 
		 $rootScope.setResScroll = function (event) { 
			    	 var winH = $(window).height();
					 var headH = $('#headerNavId').height(); 
					 var conH = winH - headH-30;
					 
					 $(".tab-content").css("height",conH+"px");
		 };

		 
		 $rootScope.refreshNotifications = function(){
			 $rootScope.$broadcast('REFRESH_NOTIFICATIONS');
		 };
		 
		// Fetch shared user data
		DataProvider.resource.User.find(Session.userId).then(function () {
			"use strict";
			$scope.sharedData.user = DataProvider.resource.User.get(Session.userId);
			
			
			$rootScope.$on('userProfilePicUpdated', function (event, data) {
				    
				    $scope.sharedData.user._img_icon=data;
				  });
			
			
		}).catch(function (error) {
			"use strict";
			console.error('Error fetching user data..')
		});

		$scope.transitionTo = function (routeName, routeParams, flags) {
			//self.closeDrawer();
			State.transitionTo(routeName, routeParams, {
				FLAGS: flags || {}
			});
		};

		$scope.transitionBack = function () {
			"use strict";
			return State.transitionBack.apply(this, arguments);
		};
		
		
		$scope.resetTransitionTo = function (routeName, routeParams) {
			//self.closeDrawer();
			
			$(window).scrollTop(0);
			
			
			State.transitionTo(routeName, routeParams, {
				FLAGS: {
					CLEAR_STACK: true
				}
			});
		};

		mobos.Utils.setLangAssets(LANG.UTILS);

		$scope.MU = {
			toolbarLoader: $rootScope.toolbarLoader,
			renewImgHash: mobos.Utils.renewImgHash,
			imgHashCounter: Math.random().toString(36).substring(7),
			getUserIconImageUrl: function (userId) {
				"use strict";
				return buildImageUrl(URL.GET_PIC, {
					userSessionId: $scope.session.id,
					entityId: userId,
					imgEntityType: "USER",
					imgType: "ICON",
					hash: mobos.Utils.imgHashCounter
				})
			},
			getUserFullImageUrl: function (userId) {
				"use strict";
				return buildImageUrl(URL.GET_PIC, {
					userSessionId: $scope.session.id,
					entityId: userId,
					imgEntityType: "USER",
					imgType: "FULL",
					hash: $scope.MU.imgHashCounter
				})
			},
			ServiceRunner: ServiceRunner,
			showToast: function (message) {
				"use strict";
				if (message) {
					$mdToast.show(
						$mdToast.simple()
							.content(message)
							//.action('View Notifications')
							.position('bottom right')
							.hideDelay(4000))
				}
			},
			buildImageUrl: buildImageUrl,
			getDisplayDate: mobos.Utils.getDisplayDate,
			getDisplayDate_DDMMYYYY: mobos.Utils.createDateFormatter('DD/MM/YYYY'),
			getDisplayDate_DDMMYYYYHHMMSS: mobos.Utils.createDateFormatter('DD/MM/YYYY HH:mm:ss'),
			getDisplayDateOffset: mobos.Utils.getDisplayDateOffset,
			getCalendarDate: mobos.Utils.getCalendarDate,
			getDisplayTime: mobos.Utils.getDisplayTime,
			getDisplayDateTime: mobos.Utils.getDisplayDateTime,
			getDisplayDateTimeOffset: mobos.Utils.getDisplayDateTimeOffset,
			getDisplayDateOff : mobos.Utils.getDisplayDateOff,
			formatDate: mobos.Utils.formatDate,
			getEventEndDate: mobos.Utils.getEventEndDate,
			isActionAvailableInTab: isActionAvailableInTab,
			getDisplayDateDDMMYYYY: mobos.Utils.createDateFormatter('Do MMM YYYY'),
			getAllowedActions: getAllowedActions
		};

		function isActionAvailableInTab(actionName, currTabName, tabItems) {
			"use strict";
			return _.indexOf(tabItems[currTabName].allowedActions, actionName) >= 0
		}

		function getAllowedActions(currTabName, tabItems) {
			"use strict";
			return tabItems[currTabName] ? tabItems[currTabName].allowedActions : [];
		}

		$scope.appDrawerToggle = function () {
			self.toggleDrawer();
		};

		function buildAppDrawerApi(navID) {

			self.toggleDrawer = $mdUtil.debounce(function () {
				$mdSidenav(navID)
					.toggle()
					.then(function () {
					});
			}, 300);


			self.openDrawer = $mdUtil.debounce(function () {
				$mdSidenav(navID)
					.open()
					.then(function () {
					});
			}, 300);

			self.closeDrawer = $mdUtil.debounce(function () {
				$mdSidenav(navID)
					.close()
					.then(function () {
					});
			}, 100, {leading: true, trailing: false});
		}

		function buildImageUrl(url, GETParams) {
			"use strict";
			return url + "?" + $.param(GETParams);
		}

		$scope.appProgressBlocker = blockUI;
		buildAppDrawerApi('appLeftNav');

		Connect.waitForSessionExpire()
			.then(null, null, function (result) {
				"use strict";
				$scope.appProgressBlocker.stop();
				Connect.rejectPendReqAfterSessionExpire();
				//localStorage.setItem("sessionExpired", true);
				DataProvider.resource.Preference.destroyAll()
				.then(function () {
				
					$scope.transitionTo('root.sessionexpired');
				
				});

			});

//		Subscribe.updateSubscription()
//			.then(function (res) {
//				"use strict";
//				console.log(res);
//			})
//			.catch(function (error) {
//				"use strict";
//				//console.log(error);
//			})
//		;

		/*
		 Initialize Chat system.
		 --------------------------
		 */
		_chatterOptions = {
			keepAlive: true,
			max_connection_retries: 10
		};
		_chatterAuthConfig = {
			username: $scope.session.userInfo.chatUserName,
			password: $scope.session.userInfo.chatPassword
		};
		ChatterService.initialize(URL.BOSH_SERVICE_ENDPOINT,
			_chatterAuthConfig, _chatterOptions);

		/* App badge update broadcast listener */
	/*	$rootScope.$on('PostHandler:COMPLETE_SUCCESS', updateAppBadge);
		$rootScope.$on('ChatService:JOIN_ROOM', updateAppBadge);
		$rootScope.$on('DashboardController:ENTER', updateAppBadge);

		function updateAppBadge() {
			"use strict";
			AppNotificationCountService.fetchNotificationCount()
				.then(function (notificationCount) {
					AppBadgeService.setBadgeNumber(notificationCount);
				})
				.catch(function (err) {
				})
			;
			
			
		}
		*/

		/*
		 Setup Chat push notification handler
		 */
	//	PushNotificationService.waitForNewNotification(PUSH_NOTIFICATION_TYPE.CHAT_SUMMARY, 'CHAT_SUMMARY_UPDATE_MASTER')
	//		.then(angular.noop, angular.noop, DashboardPushNotificationHandler);
		
		//------------------------

		/*
		 Setup Dashboard Post notification handler
		 */
	//	PushNotificationService.waitForNewNotification(PUSH_NOTIFICATION_TYPE.NEW_POST, 'NEW_DASHBOARD_POST_MASTER')
	//		.then(angular.noop, angular.noop, DashboardPushNotificationHandler);

		$scope.$on('$destroy', function () {
			"use strict";
			//deregisterNotificationListener && deregisterNotificationListener();
		});

	//	PushNotificationService.waitForNewNotification(PUSH_NOTIFICATION_TYPE.APP_GLOBAL_NOTIFICATION, 'APP_NOTI')
	//		.then(angular.noop, angular.noop, onAppGlobalNotificationHandler);

		function onAppGlobalNotificationHandler(noti) {
			"use strict";
			console.log("new app global notification");
			console.log(noti);
			console.log("---------------------------");
		}

		function DashboardPushNotificationHandler(noti) {
			"use strict";
			console.log("new dashboard post");
			console.log(noti);
			console.log("----------------");

			var _curr_view = State.curr().toState
				;
			if (_curr_view == 'root.app.dashboard') {
				return;
			}

			if (noti) {
				var toastMessage = noti.title || noti.message || null;
				if (toastMessage) {
					$mdToast.show(
						$mdToast.simple()
							.content(toastMessage)
							.action('View Notifications')
							.position('bottom right')
							.hideDelay(4000))
						.then(function () {
							$scope.transitionTo('root.app.dashboard');
						});
				}
			}
		}

		/**
		 * scroll to top
		 */
		function scrollToTop(){
			$(window).scrollTop(0);
		}
		
		/**
		 * To Apply scrolling to main section row
		 * of type layout-gravity="free"
		 */
		function addMainSectionScroll(){
			$('row[layout-gravity="free"]' ).removeClass('chat-content-scroll');
			$('row[layout-gravity="free"]' ).addClass('layout-content-scroll');
			  $timeout(function() {
				  $('row[layout-gravity="free"]' ).removeClass('chat-content-scroll');
				  $('row[layout-gravity="free"]' ).addClass('layout-content-scroll');
		      }, 1000);
		}
		
		
		/**
		 * Remove the temporary credentials stored
		 * in localstorage
		 */
		if(localStorage.getItem(SESSION_PSWD) && localStorage.getItem(SESSION_PSWD) !== "undefined"){
			$rootScope.sessionCred = angular.fromJson(localStorage.getItem(SESSION_PSWD));
	    	localStorage.removeItem(SESSION_PSWD);
		}
		
		
		/**
		 * Talk Related Functionality
		 */
		
		$rootScope.$on(MEETING_VIEW_EVENTS.START_MEETING, function(event, args){
			console.log("Invoked MEETING_VIEW_EVENTS.START_MEETING...");
			initMeetingViewScopeModel(args.meetingInfo);

		});
		
		$rootScope.$on(MEETING_VIEW_EVENTS.SHOW_MEETING_OPTIONS, function(event, args){
			console.log("Invoked MEETING_VIEW_EVENTS.SHOW_MEETING_OPTIONS...");
			$scope.showMeetingOpts = args.isShown;

		});
		
		function initMeetingViewScopeModel( meetingObj){
			$scope.meetingInProgress = true;
			$scope.isMeetingInProgress = false; 
			$scope.meetingInfo = {};
			$scope.isModerator = false;
			$scope.participantsList = [ ];
			$scope.participant_KV = {};
			$scope.isUserMuted = false;
			$scope.userId = Session.userId;
			$scope.APP_MU = AppCoreUtilityServices;
			$scope.audioOPDevicesList = [ ];
			$scope.volumeLevel = 0;
			$scope.showMeetingPrompt = false;
			var userId = Session.userId;
			$scope.meetingInfo.isTimerRunning = false;

			$scope.toRedirectMeeting = function() {
		        var orgId = meetingObj.orgId;
		        
		        if(meetingObj.orgId && meetingObj.jobId){
		        	$scope.transitionTo('root.app.job-view.jobTalk', {
		        		jobId: parseInt(meetingObj.jobId),
		        		orgId: parseInt(meetingObj.orgId),
		        	}, {
		        		REPLACE_STATE: true
		        	});

		        } else if (meetingObj.groupId) {
		        	var groupId = meetingObj.groupId;
		        	$scope.transitionTo('root.app.group-dashboard.groupMeeting', {
		        		orgId: parseInt(orgId),
		        		groupId: parseInt(groupId)
		        	}, {
		        		REPLACE_STATE: true
		        	});

		        } else {
			        $scope.transitionTo('root.app.org-dashboard.orgMeeting', {
			          orgId: parseInt(orgId)
			        }, {
			          REPLACE_STATE: true
			        });
				}
			}
			
			$scope.addMember = {
					sendToAll : false,
					attendees : []
			};

			$scope.isModerator = !!meetingObj.isModerator;

			$scope.resetAfterEndMeeting = function () {
				//$mdDialog.hide();
				refreshAfterLeaveMeeting();
			}

			var meetingEndPromptInterval = null;
			var meetingTimeout = null;
			var PROMPT_DEFAULT_MINS = 2;
			var EXTEND_DEFAULT_MINS = 15;

			$scope.joinMeeting = function(meetingObj){

				prepareParticipantsList(meetingObj);

				var params = {
						catType : meetingObj.catType,
						catId : meetingObj.catId,
						meetingId: meetingObj.meetingId,
						userId : $scope.userId,
						roomName : meetingObj.roomName,
						roomPassword : meetingObj.roomPassword
				};

				$scope.meetingInfo = meetingObj;

//				if(!$scope.isModerator){
//					$scope.isModerator = ($scope.userId == meetingObj.owner.id) ? true : false;
//					$scope.forceModerator = true;
//				}

				params.isModerator = $scope.isModerator;
				params.userName = $scope.isModerator? meetingObj.owner.userFirstName+"_"+meetingObj.owner.userLastName
						: $scope.participant_KV[''+$scope.userId].details.displayName;

				updateMemberJoinedStatus($scope.userId, null, true);

				var joinMeetingService = ($scope.isModerator && !$scope.forceModerator)? joinModeratorToMeeting : joinMeeting;

				joinMeetingService(params).then(function (res) {

					$scope.isMeetingInProgress = true;
					updateMemberJoinedStatus($scope.userId, null, true);
					$scope.isModerator && _runMeetingTimer($scope.meetingInfo.endTime, PROMPT_DEFAULT_MINS);
					
					if($scope.meetingInfo.isNewMember){
						var ind = _.findIndex($scope.meetingInfo.members, {"id":$scope.userId});
						if(ind > -1){
							$scope.addMember.attendees.push($scope.meetingInfo.members[ind]);
							$scope.addMembersToMeeting(true); 
							$scope.addingMembersToMeeting(true);
						}
						
					}

				}, function (error) {
					console.log("error join meeting request....");
					//showMessageWithCloseDelay(error.respMsg);

					$timeout(function() { 
						blockUI.stop(); 
						Dialog.alert({
							content: error.respMsg,
							ok: "Ok"
						});
//						$scope.resetAfterEndMeeting();

					}, 1000);

				}).catch(function (err) {

				}).finally(function () {
					/*	ConferenceService.getAudioOutputDevices().then(function(devices){
					$scope.audioOPDevicesList = devices;
					$scope.selectedAudioOPDevice = (devices.length > 0) ? devices[0] : null;
				});
					 */
				});
			};

			$scope.addMembersToMeeting = function(sendToAll){
				if (sendToAll) {
					$scope.addMember.attendees = [];
					var _params = {
							catId: meetingObj.catId,
							catType: meetingObj.catType,
							meetingId: meetingObj.meetingId
					};
					
					//@TODO enable below code if search and join members functionality is required
					/*
					blockUI.start("Loading...", {
						status: 'isLoading'
					});
					
					DataProvider.resource.Meeting.memberSearch(_params, {bypassCache: true,autoClose: false}).then(function(members) {
						if (members.length == 0) {
							blockUI.stop("No Members found", {
								status: 'isError',
							}); 
							$scope.addMember = {
									sendToAll : false,
									attendees : []
							};
						} else {
							blockUI.stop();
						}
						angular.forEach(members, function(member, key) {
							var index = _.findIndex($scope.addMember.attendees, member);
							if (index == -1) {
								$scope.addMember.attendees.push(member);
							}
						});
					}).catch(function() {
						blockUI.stop();
					}).finally(function () {
					});
					
					*/
					
				} else{
					$scope.addMember.attendees = [];
				}
			}

			$scope.removeSelectedMember =  function (user) {
				_.remove($scope.addMember.attendees, {
					id: user.id
				});
				$scope.addMember.sendToAll = false;
			}

			$scope.addingMembersToMeeting = function(skipMeetingAddService){
				var deferred = $q.defer();
				blockUI.start("Loading...", {
					status: 'isLoading'
				});
				var members = [];
				if(skipMeetingAddService){
					$scope.addMember.attendees.push($scope.meetingInfo.newMemberInfo);
				}
				angular.forEach($scope.addMember.attendees, function(invitee, key) {
					members.push(invitee.id);

					var participant = {};
					participant.id = invitee.id;
					participant.userFirstName = invitee.userFirstName;
					participant.userLastName = invitee.userLastName;
					participant.displayName = invitee.userFirstName+"_"+invitee.userLastName;
					participant.userName = invitee.userFirstName+" "+invitee.userLastName;
					participant.hasJoined = skipMeetingAddService?true : false;

					ConferenceService.newParticipantListener(MEETING_CUSTOM_COMMANDS.NEW_MEMBER_ADDED, {
						attributes : participant
					});
				});
				var _params = {
						catId: meetingObj.catId,
						catType: meetingObj.catType,
						id: meetingObj.meetingId,
						members : members
				};
				
				if(!skipMeetingAddService){
					DataProvider.resource.Meeting.addMembers(_params, {bypassCache: true,autoClose: false}).then(function(result) {
						$scope.addMember = {
								sendToAll : false,
								members : []
						};
						return deferred.resolve(result);
					}).catch(function() {
						deferred.reject();
					}).finally(function () {

					});
				}else{
					blockUI.stop();
				}
				return deferred.promise;
			}

			$scope.memberSearch = {
					selection: null,
					searchText: "",
					selectedItemChange: function(user) {
						if (user) {
							delete user.$$hashKey;
							var index = _.findIndex($scope.addMember.attendees, user);
							if (index == -1) {
								$scope.addMember.attendees.push(user);
							}
						}
						$timeout(function() {
							$scope.memberSearch.searchText = "";
						}, 200)
					},
					querySearch: function(queryStr) {
						var _params = {
								catId: meetingObj.catId,
								catType: meetingObj.catType,
								meetingId: meetingObj.meetingId,
								searchByName:queryStr
						};
						if (queryStr && queryStr.length > 0) {
							var deferred = $q.defer();
							DataProvider.resource.Meeting.memberSearch(_params, {bypassCache: true,autoClose: false}).then(function(result) {
								return deferred.resolve(result);
							}).catch(function() {
								deferred.reject();
							});
							return deferred.promise;
						} else {
							return [];
						}
					}
			};

			function prepareParticipantsList(meetingObj){
				$scope.participantsList = [];
				$scope.participant_KV = {};

				var participant = {};
				participant.id = meetingObj.owner.id;
				participant.displayName = meetingObj.owner.userFirstName+"_"+meetingObj.owner.userLastName;
				participant.userName = meetingObj.owner.userFirstName+" "+meetingObj.owner.userLastName;
				participant.hasJoined = false;
				$scope.participantsList.push(participant);	
				$scope.participant_KV[''+participant.id] = {};
				$scope.participant_KV[''+participant.id].details = participant;


				for(var i = 0; i < meetingObj.attendees.length; i++){
					var participant = {};
					participant.id = meetingObj.attendees[i].id;
					participant.displayName = meetingObj.attendees[i].userFirstName+"_"+meetingObj.attendees[i].userLastName;
					participant.userName = meetingObj.attendees[i].userFirstName+" "+meetingObj.attendees[i].userLastName;
					participant.hasJoined = false;

					$scope.participantsList.push(participant);	

					$scope.participant_KV[''+participant.id] = {};
					$scope.participant_KV[''+participant.id].details = participant;
				}
			}

			function updateMemberJoinedStatus(userId, confParticipantId, isMemberJoined){

				if(!!$scope.participant_KV[""+userId]){
					$scope.participant_KV[""+userId].details.hasJoined = isMemberJoined;
					$scope.participant_KV[""+userId].details.conferenceParticipantId = confParticipantId;
				}


				for(var i = 0; i < $scope.participantsList.length; i++){
					if(userId == (""+$scope.participantsList[i].id)){
						$scope.participantsList[i].hasJoined = isMemberJoined;
						$scope.participantsList[i].conferenceParticipantId = confParticipantId; 
						return;
					}
				}
			}

			function refreshAfterLeaveMeeting(){
					$scope.isMeetingInProgress = false;
					$scope.isModerator = false;
					$scope.meetingInfo = {};
					$scope.participantsList = [ ];
					$scope.participant_KV = {};
					$scope.showMeetingOpts = true;
					$scope.meetingInfo.isTimerRunning = false;
				//$mdDialog.hide();
			}
			$rootScope.$on(MEETING_CUSTOM_COMMANDS.CUSTOM_END,function (event, args) {
				console.log(args);
				$scope.leaveMeeting(args)
            })
			$scope.leaveMeeting = function(meetingObj){
				var deferred = $q.defer();
				var params = {
						catType : meetingObj.catType,
						catId : meetingObj.catId,
						meetingId: meetingObj.meetingId,
						isModerator : $scope.isModerator
				};

                if($scope.isModerator) {
                    ConferenceService.emitEndConfrence(params);
                }

				if($scope.isModerator){
					for(var userId in $scope.participant_KV){
						removeParticipantFromMeeting($scope.participant_KV[userId].details.conferenceParticipantId);
					}
				}

				leaveMeeting(params).then(function (res) {
					refreshAfterLeaveMeeting();
					var message = $scope.isModerator? "Ending the conference..." : "Exiting the conference...";
					showMessageWithCloseDelay(message);
					_clearMeetingTimer();
					
					deferred.resolve();

				}).catch(function (err) {
					deferred.resolve();
				}).finally(function () {
					//refreshAfterLeaveMeeting();
				});

				return deferred.promise;
			};


			$scope.removeParticipantFromMeeting = function(roomUserId, meetingId, participantId) {

				ConferenceService.newParticipantListener(MEETING_CUSTOM_COMMANDS.MEMBER_REMOVED, {
					attributes : {userId : participantId}
				});

				if (meetingId) {
					meetingMemberEvents(meetingId, MEETING_EVENT_TYPES.MEMBER_EVENT_REMOVED, participantId);	
				}

				deleteParticipantFromList(participantId);
				removeParticipantFromMeeting(roomUserId);
			};

			$scope.toggleMuteUser = function(toggleVal){

				if(!!toggleVal){
					muteUser();
				}else{
					unmuteUser();
				}
			};
			
			function muteUser(){
				ConferenceService.muteLocalUser();
			}
			
			function unmuteUser(){
				ConferenceService.unmuteLocalUser();
			}
			
			$scope.changeAudioOPDevice = function(device){
				ConferenceService.changeAudioOutput(device);
			};


			$scope.setLocalTrackVolume = function(vol){
				var level = parseFloat(vol);
				ConferenceService.setLocalTrackElementVolume(level);
			}

			function showMessageWithCloseDelay(msg){
				blockUI.start(msg, {
					status: 'isLoading'
				});

				$timeout(function() { 
					blockUI.stop(msg, {
						status: 'isError',
						action: LANG.BUTTON.OK
					}); 

					$scope.resetAfterEndMeeting();

				}, 8000);
			}

			function deleteParticipantFromList(userId){
				delete $scope.participant_KV[""+userId];

				for(var i = 0; i < $scope.participantsList.length; i++){
					if(userId == (""+$scope.participantsList[i].id)){
						$scope.participantsList.splice(i,1);
					}
				}

				for(var i = 0; i < $scope.meetingInfo.attendees.length; i++){
					if(userId == ($scope.meetingInfo.attendees[i].id)){
						$scope.meetingInfo.attendees.splice(i,1);
//						meetingObj.members.splice(i,1);
					}
				}

			}

			$rootScope.$on(CONFERENCE_BROADCAST.PARTICIPANT_JOINED, function(event, args){
				console.log("invoked participant joined ======================> "+args.userDetails._displayName);
				var joinedUserDetails = angular.extend({},args.userDetails); 
				var joinedUserId = joinedUserDetails._displayName.split("@@")[1];
				var conferenceParticipantId = args.conferenceParticipantId;
				console.log("invoked participant user Id ======================> "+joinedUserId+"  conferenceParticipantId===> "+conferenceParticipantId);

				/**
				 * Join user if doesn't exists in participants list
				 */
				var obj = joinedUserDetails;
				obj.id = parseInt(joinedUserId);
				obj.hasJoined = (obj.hasJoined === 'true');
				var index2 = _.findIndex($scope.participantsList, obj);
				var ind = _.findIndex($scope.meetingInfo.members, {"id":obj.id});
				if(ind > -1){
					var joinedUser = $scope.meetingInfo.members[ind];
					obj.userName = joinedUser.userFirstName+" "+joinedUser.userLastName;
					obj.userFirstName = joinedUser.userFirstName;
					obj.userLastName = joinedUser.userLastName;
				}
				
				if (index2 == -1) {
					delete obj.$$hashKey;
					$scope.$apply(function() {
						var index1 = _.findIndex($scope.meetingInfo.attendees, {"id":obj.id});
						if (index1 == -1) {
							$scope.meetingInfo.attendees.push(obj);
						}

						$scope.participantsList.push(obj);
						$scope.participant_KV[''+obj.id] = {};
						$scope.participant_KV[''+obj.id].details = obj;

					});

				}


				$scope.$apply(function() {
					updateMemberJoinedStatus(joinedUserId, conferenceParticipantId, true);
				});

			});

            $rootScope.$on(MEETING_CUSTOM_COMMANDS.MEMBER_REMOVED, function(event, args){
                var id = parseInt(args.userDetails.attributes.userId);

                if(parseInt(Session.userId)===id){
                    $rootScope.$broadcast(CONFERENCE_BROADCAST.LOCAL_PARTICIPANT_KICKED,args);
                }else{
                    console.log("MEETING_CUSTOM_COMMANDS.MEMBER_REMOVED jitsi command ======================> "+angular.toJson(args.userDetails.attributes));
                    deleteParticipantFromList(id);
                }
            });

			$rootScope.$on(MEETING_CUSTOM_COMMANDS.NEW_MEMBER_ADDED, function(event, args){
				console.log("MEETING_CUSTOM_COMMANDS.NEW_MEMBER_ADDED jitsi command ======================> "+angular.toJson(args.userDetails.attributes));
				var obj = args.userDetails.attributes;
				obj.id = parseInt(args.userDetails.attributes.id);
				if(obj.hasJoined === 'true'){
					obj.hasJoined = true;
				}
				obj.userFirstName = args.userDetails.attributes.userFirstName;
				obj.userLastName = args.userDetails.attributes.userLastName;
				
				
				delete obj.$$hashKey;
				$scope.$apply(function() {
					var index1 = _.findIndex($scope.meetingInfo.attendees, {"id":obj.id});
					if (index1 > -1) {
						_.remove($scope.meetingInfo.attendees, {"id":obj.id});
					}
					$scope.meetingInfo.attendees.push(obj);
					
					var index2 = _.findIndex($scope.participantsList, {"id":obj.id});
					
					//var index2 = _.findIndex($scope.participantsList, obj);
					if (index2 == -1) {
						$scope.participantsList.push(obj);
						$scope.participant_KV[''+obj.id] = {};
						$scope.participant_KV[''+obj.id].details = obj;
					}

				});

			});

			$rootScope.$on(CONFERENCE_BROADCAST.PARTICIPANT_LEFT, function(event, args){
				console.log("invoked participant Left ======================> "+args.userDetails._displayName);
				var joinedUserDetails = angular.extend({},args.userDetails); 
				var joinedUserId = joinedUserDetails._displayName.split("@@")[1];
				var conferenceParticipantId = args.conferenceParticipantId;
				console.log("invoked participant user Id ======================> "+joinedUserId);
				if(args.isForced){
					updateMemberJoinedStatus(joinedUserId,conferenceParticipantId, false);
				}else{
					$scope.$apply(function() {
						updateMemberJoinedStatus(joinedUserId,conferenceParticipantId, false);
					});
				}


			});


			$rootScope.$on(CONFERENCE_BROADCAST.LOCAL_PARTICIPANT_KICKED, function(event, args){
				$rootScope.isScheduledMeetingInProgress = false;
				
				console.log("invoked LOCAL_PARTICIPANT_KICKED ======@"+$rootScope.isScheduledMeetingInProgress);
				
				leaveMeetingOnUserKick();
				refreshAfterLeaveMeeting();
				$rootScope.$broadcast(MEETING_VIEW_EVENTS.END_MEETING); 
				_clearMeetingTimer();
				showMessageWithCloseDelay("You are removed from the conference.");
			});

			$rootScope.$on(MEETING_CUSTOM_COMMANDS.MEETING_EXTENDED, function(event, args){
				console.log("MEETING_CUSTOM_COMMANDS.MEETING_EXTENDED jitsi command ====================== "+args.endTime);
				$scope.meetingInfo.endTime  = parseInt(args.endTime);
				$scope.$apply(function() {
					$scope.showMeetingPrompt = true;
				});

			});

			$scope.updateMeetingEndTime = function(meetingId, endTime) {
				var deferred = $q.defer();

				$scope.meetingInfo.isTimerRunning = false;
				
				blockUI.start("Extending meeting end time by 10 mins...", {
					status: 'isLoading'
				});

				var _params = {
						id: meetingId,
						endTime: endTime+(EXTEND_DEFAULT_MINS*60000)
				};

				DataProvider.resource.Meeting.meetingExtend(_params)
				.then(function (res) {
					$scope.meetingInfo.endTime = res.endTime;
					_clearMeetingTimer();
					_runMeetingTimer(res.endTime, PROMPT_DEFAULT_MINS); 

					ConferenceService.newParticipantListener(MEETING_CUSTOM_COMMANDS.MEETING_EXTENDED, 
							{
						attributes : {endTime : res.endTime} 
							});

					deferred.resolve(res);
				}, function (error) {
					Dialog.alert({
						content: error.respMsg,
						ok: "Ok"
					});
					deferred.reject(error);
				}).finally(function () {
					blockUI.stop();
				});

				return deferred.promise;
			}


			$scope.cancelMeetingExtend = function(){
				$("#alert-wrapper").animate({ zoom: 0.8, opacity :0, display:'none' }, 100);
				$("#alert-wrapper").css('display','none');
			};

			function _runMeetingTimer(endTimeStamp, promptIntervalMins){
				
				var currentTimeStamp = (new Date()).getTime();
				var promptMillSec =  endTimeStamp - currentTimeStamp - (promptIntervalMins*60000);
				//if(promptMillSec < (promptIntervalMins*60000)){
				//	promptIntervalMins = Math.floor((endTimeStamp - currentTimeStamp)/60000)-1;
				//}
				meetingTimeout = setTimeout(function(){ 
					_countdown('countdown',promptIntervalMins , 0, _handleTimerMeetingEnd);

				}, promptMillSec);

			}

			function _handleTimerMeetingEnd(){
				$scope.leaveMeeting($scope.meetingInfo);
			}

			function _countdown(elementId, minutes, seconds, callBack) {
				$scope.$apply(function(){
					$scope.meetingInfo.isTimerRunning = true;
				});
				
				$("#alert-wrapper").css({ zoom: 0.8, opacity :0, display:'none' }).animate({ zoom: 1, opacity :1, display:'block' },100);
				$("#alert-wrapper").css('display','block');

				// set time for the particular countdown
				var time = minutes*60 + seconds;
				meetingEndPromptInterval = setInterval(function() {
					var el = $("#"+elementId);
					// if the time is 0 then end the counter
					if (time <= 0) {
						!!callBack && callBack();
						return;
					}
					var minutes = Math.floor( time / 60 );
					if (minutes < 10) minutes = "0" + minutes;
					var seconds = time % 60;
					if (seconds < 10) seconds = "0" + seconds; 
					var text = minutes + ':' + seconds;
					el.text(text);
					time--;
				}, 1000);
			}

			function _clearMeetingTimer(){

				$("#alert-wrapper").animate({ zoom: 0.8, opacity :0, display:'none' }, 100);
				$("#alert-wrapper").css('display','none');

				!!meetingTimeout && clearTimeout(meetingTimeout);
				!!meetingEndPromptInterval && clearInterval(meetingEndPromptInterval);

				meetingTimeout = null;
				meetingEndPromptInterval = null;
			}
			
			
			function joinMeeting(params) {
				var deferred = $q.defer();
				var _ser_params = {
								catId : params.catId,
								catType : params.catType,
								meetingId : params.meetingId
							};
				var isModerator = params.isModerator;
				
				var msg = isModerator? "Starting Conference.." : "Joining Conference..";	
				blockUI.start(msg, {
					status: ''
				});
//				DataProvider.resource.Meeting.meetingJoin(_ser_params)
//				.then(function (res) {
					
					console.log("Sent join meeting request connected....");
					
					ConferenceService.initConnection().then(function(){
						console.log("Jitsi connected....");
						
						var joinRoom = isModerator? ConferenceService.connectModerator : ConferenceService.connectParticipant;
						
						joinRoom(meetingObj.roomName, meetingObj.roomPassword, params.userName, params.userId)
						.then(function (res){
						      // isModerator && sendMeetingStartNotification(_ser_params);
						       meetingMemberEvents(params.meetingId, MEETING_EVENT_TYPES.MEMBER_EVENT_JOINED);
								blockUI.stop();
						      	deferred.resolve(res);
						      }, 
						      function (conErr){
						    	blockUI.stop();
								deferred.reject(conErr);
						      });
						     
					});
					
//					
//				}, function (error) {
//					console.log("error join meeting request....");
//					deferred.reject(error);
//				}).finally(function () {
//				});
				return deferred.promise;
			}
			
			function joinModeratorToMeeting(params){
				var deferred = $q.defer();
				var _ser_params = {
								catId : params.catId,
								catType : params.catType,
								meetingId : params.meetingId
							};
				var isModerator = params.isModerator;
				
				var msg = "Starting Conference..";	
				blockUI.start(msg, {
					status: ''
				});
				
				console.log("Sent join meeting request connected....");
				
				ConferenceService.initConnection().then(function(){
					console.log("Jitsi connected....");
					
					var joinRoom = isModerator? ConferenceService.connectModerator : ConferenceService.connectParticipant;
					
					ConferenceService.connectModerator(params.roomName, params.roomPassword, params.userName, params.userId)
					.then(function (res){
							
							blockUI.stop();
					      	deferred.resolve(res);
					      }, 
					      function (conErr){
					    	blockUI.stop();
							deferred.reject(conErr);
					      });
					     
				});
				
				return deferred.promise;
			};
			
			function removeParticipantFromMeeting(roomUserId){
				
				ConferenceService.kickUser(roomUserId);
			}
			
			function leaveMeeting(params){
				
				var deferred = $q.defer();
				var _params = {
						catId : params.catId,
						catType : params.catType,
						meetingId : params.meetingId
					};
				
				$rootScope.isScheduledMeetingInProgress = false;
				
				meetingMemberEvents(params.meetingId, MEETING_EVENT_TYPES.MEMBER_EVENT_LEFT);
				ConferenceService.leaveConference();
				
				refreshAfterLeaveMeeting();
				
				deferred.resolve();
				
			   if(params && params.isModerator){
					DataProvider.resource.Meeting.meetingEnd(_params).then(function(res){
						$rootScope.$broadcast(MEETING_VIEW_EVENTS.END_MEETING); 
						deferred.resolve(res);
					}, function (error) {
						deferred.reject(error);
					});
				}else{
					$rootScope.$broadcast(MEETING_VIEW_EVENTS.END_MEETING); 
					deferred.resolve();
				}
				
				return deferred.promise;
			}
			
			function meetingMemberEvents(id, type, participantId) {
				var deferred = $q.defer();

				var _params = {
						id : id,
						userId : !!participantId ? participantId : userId ,
						eventLogType : type
				};

				DataProvider.resource.Meeting.memberEvent(_params).then(function(res){
					deferred.resolve(res);
				}, function (error) {
					deferred.reject(error);
				});

				return deferred.promise;
			}
			

			function leaveMeetingOnUserKick(){
				ConferenceService.leaveConference();
			}
			
			
			
			
			$scope.joinMeeting(meetingObj);
			
			
			
		}
		
		//check if any meeting is in progress and leave/end meeting.
		$scope.checkAndExitMeeting = function() {
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
		};
		
		
		/**
		 * Talk Related Functionality Ends
		 */
	}

	AppMasterController.$inject = ['$scope', '$rootScope','State','$q', '$stateParams', '$timeout', 'Session',
		'ServiceRunner', '$mdSidenav', '$mdUtil',
		'DataProvider', 'blockUI', 'mDialog', '$mdToast',
		'Connect',
		'PushNotificationService',
		'ChatterService',
		'APP_DATA_CSS', 'Lang', 'APP_INFO', 'APP_BROADCAST', 'DEFAULT_ENDPOINT', 'BOSH_ENDPOINT', 'URL',
		'PUSH_NOTIFICATION_TYPE', 'AuthService', 'SESSION_PSWD',
		'MEETING_VIEW_EVENTS', 'ConferenceService','AppCoreUtilityServices',
		'MEETING_TYPES', 'CATEGORY_TYPE', 'MEETING_CUSTOM_COMMANDS', 'CONFERENCE_BROADCAST',
		'meetingService', 'MEETING_EVENT_TYPES'];

	
	

})();
