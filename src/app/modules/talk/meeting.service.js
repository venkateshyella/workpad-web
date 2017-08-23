/**
 * Created by sandeep on 24/11/16.
 */
(function () {
	"use strict";
	angular.module('app.services')
	.service('meetingService', ['$q', 'Connect','mDialog', '$mdToast','blockUI', 'Lang','DataProvider',
	                            'URL','AppCoreUtilityServices','Session', 'MEETING_STATUS','ConferenceService','MEETING_EVENT_TYPES',
	                            meetingService])
    .filter('unique', function() {
    	return function(input, key) {
    		var unique = {};
    		var uniqueList = [];
    		for(var i = 0; i < input.length; i++){
    			if(typeof unique[input[i][key]] == "undefined"){
    				unique[input[i][key]] = "";
    				uniqueList.push(input[i]);
    			}
    		}
    		return uniqueList;
    	};
    });
	function meetingService($q, Connect, Dialog, $mdToast , blockUI, Lang, 
			DataProvider, URL, AppCoreUtilityServices, Session, MEETING_STATUS, ConferenceService, MEETING_EVENT_TYPES) {
		var LANG = Lang.en.data;
		
		var _self = this;
		var userId = Session.userId;
		var meeting_members = [];
		
		function CreateAdhocMeeting(model) {
			var deferred = $q.defer(), createMeetingDialogOptions;
			createMeetingDialogOptions = {
					controller: ['$scope', '$stateParams', '$mdDialog', 'blockUI', 'mDialog',  'AppCoreUtilityServices','$timeout', AdhocMeetingDialogController],
					templateUrl: 'app/modules/talk/meetingCreate.dialog.tpl.html',
					clickOutsideToClose:false
			}
			Dialog.show(createMeetingDialogOptions)
			.then(function (res) {
				deferred.resolve(res)
			})
			.catch(function (err) {
				deferred.reject(err);
			})
			.finally(function () {
			});
			return deferred.promise;
			function AdhocMeetingDialogController($scope, $stateParams, $mdDialog, blockUI, mDialog, AppCoreUtilityServices, $timeout) {
				$scope.form = {};
				$scope.formModel = {};
				$scope.formModel.members = [];
				$scope.isUpdate = false;
				$scope.prepareMeetingEndTime = prepareMeetingEndTime;
				$scope.MU = {
						getDisplayDateTimeOffset:mobos.Utils.getDisplayDateTimeOffset
				};
				if (model.id) {
					$scope.isUpdate = true;
					$scope.formModel = model;
					$scope.formModel.name = model.meetingName;
					var hourDiff= model.endTime - model.startTime;;
					var minDiff = hourDiff / 60 / 1000;
					var hDiff = hourDiff / 3600 / 1000;
					$scope.formModel.hours = Math.floor(hDiff);
					$scope.formModel.minutes = Math.floor(minDiff - 60 * $scope.formModel.hours);
					$scope.formModel.startTime =  model.startTime;
					$scope.formModel.endTime = prepareMeetingEndTime($scope.formModel);
					if ($scope.formModel.hours == 0) {
						$scope.minimumMinutes = 30;
					} else {
						$scope.minimumMinutes = 0;
					}
					_.remove($scope.formModel.members, {
						id:$scope.formModel.moderator.id
					});
				} else {
					//$scope.formModel.orgId = model.orgId;
					$scope.formModel.catType = model.catType;
					$scope.formModel.catId = model.catId;
					$scope.formModel.meetingType = model.meetingType;
					$scope.formModel.startTime = new Date().getTime();
					$scope.formModel.hours = 0;
					$scope.formModel.minutes = 30;
					$scope.minimumMinutes = 30;
					$scope.formModel.endTime = prepareMeetingEndTime($scope.formModel);
				}
				$scope.close = function () {
					$mdDialog.hide();
				}
				$scope.setMinMinutes = function() {
					if ($scope.formModel.hours == 0) {
						$scope.minimumMinutes = 30;	
						if ($scope.formModel.minutes < $scope.minimumMinutes) {
							$scope.formModel.minutes = 30;	
						}
					} else {
						$scope.minimumMinutes = 0;
					}
				}
				$scope.removeSelectedMember =  function (user) {
					_.remove($scope.formModel.members, {
						id: user.id
					});
					$scope.formModel.sendToAll = false;
				}
				$scope.memberSearchCtrl = {
						selection: null,
						searchText: "",
						selectedItemChange: function(user) {
							if (user) {
								delete user.$$hashKey;
								var index = _.findIndex($scope.formModel.members, user);
								if (index == -1) {
									$scope.formModel.members.push(user);
								}
							}
							$timeout(function() {
								$scope.memberSearchCtrl.searchText = "";
							}, 200)
						},
						querySearch: function(queryStr) {
							var _params = {
									catId: model.catId,
									catType: model.catType,
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
				function prepareMeetingEndTime(formModel) {
					var d = new Date(formModel.startTime);
					d.setHours(d.getHours() + formModel.hours);
					d.setMinutes(d.getMinutes() + formModel.minutes);
					return d.getTime();
				}
				$scope.submitToCreate = function(formModel) {
					blockUI.start("Creating...", {
						status: 'isLoading'
					});
					var req = parseToEntity(formModel);
					if (req.message) {
						blockUI.stop(req.message, {
							status: 'isError',
							action: 'Ok'
						});
					} else {
						meetingCreate(req).then(function (res) {
							blockUI.stop("Meeting Created Successfully...");
							
							res.resp.startTime = formModel.startTime;
							res.resp.endTime = formModel.endTime;
							res.resp.meetingName = formModel.name;
							res.resp.members = formModel.members;
							res.resp.moderator = Session.userInfo;
							res.resp.catId = model.catId;
							res.resp.catType = model.catType;
							res.resp.members[res.resp.members.length] = Session.userInfo;
							res.resp.members.reverse();
							
							$mdDialog.hide(res);
						}).catch(function (err) {
							blockUI.stop();
							$mdDialog.cancel(err);
						}).finally(function () {
						});
					}
				};
				$scope.addAllMembersToMeeting = function(sendToAll){
					if (sendToAll) {
						$scope.formModel.members = [];
						var _params = {
								catId: model.catId,
								catType: model.catType,
						};
						blockUI.start("Loading...", {
							status: 'isLoading'
						});
						DataProvider.resource.Meeting.memberSearch(_params, {bypassCache: true,autoClose: false}).then(function(members) {
							angular.forEach(members, function(member, key) {
								var index = _.findIndex($scope.formModel.members, member);
								if (index == -1) {
									$scope.formModel.members.push(member);
							}
							});
						}).catch(function() {
						}).finally(function () {
							blockUI.stop();
						});
					} else{
						$scope.formModel.members = [];
					}
				
				}
				$scope.submitToUpdate = function(formModel) {
					blockUI.start("Updating...", {
						status: 'isLoading'
					});
					var req = parseToEntity(formModel);
					if (req.message) {
						blockUI.stop(req.message, {
							status: 'isError',
							action: 'Ok'
						});
					} else {
						meetingUpdate(req).then(function (res) {
							blockUI.stop("Meeting Updated Successfully...");
							$mdDialog.hide(res);
						}).catch(function (err) {
							blockUI.stop();
							$mdDialog.cancel(err);
						}).finally(function () {
						});
					}
				};
			}
		}
		function parseToEntity(formModel) {
			var meetingEntity = {};
			meetingEntity.members = [];
			if ( new Date().getTime() > formModel.endTime ) {
				meetingEntity.message = "Meeting end time must be greater than current time";
				return meetingEntity;
			}
			if (formModel.id) {
				meetingEntity.id = formModel.id;
				meetingEntity.name = formModel.meetingName;
			} else {
				meetingEntity.name = formModel.name;
			}
			meetingEntity.startTime = formModel.startTime;
			meetingEntity.endTime = formModel.endTime;
			angular.forEach(formModel.members, function(invitee, key) {
				meetingEntity.members.push(invitee.id)
			});
			meetingEntity.desc = formModel.desc;
			meetingEntity.meetingType = formModel.meetingType;
			//meetingEntity.orgId = formModel.orgId;
			meetingEntity.catId = formModel.catId;
			meetingEntity.catType = formModel.catType;
			return meetingEntity;
		}
		function meetingCreate(formModel) {
			var deferred = $q.defer();
			DataProvider.resource.Meeting.meetingCreate(formModel)
			.then(function (res) {
				deferred.resolve(res);
			}, function (error) {
				deferred.reject(error);
			}).finally(function () {
			});
			return deferred.promise;
		}
		function meetingUpdate(formModel) {
			var deferred = $q.defer();
			DataProvider.resource.Meeting.meetingUpdate(formModel)
			.then(function (res) {
				deferred.resolve(res);
			}, function (error) {
				deferred.reject(error);
			}).finally(function () {
			});
			return deferred.promise;
		}
		function meetingStatus(status) {
			if(status === MEETING_STATUS.CREATED) {
				return 'Created'
			} else if(status === MEETING_STATUS.STARTED) {
				return 'Started'
			} else if (status === MEETING_STATUS.FINISHED) {
				return 'Finished'
			} 
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
			DataProvider.resource.Meeting.meetingJoin(_ser_params)
			.then(function (res) {
				
				console.log("Sent join meeting request connected....");
				
				ConferenceService.initConnection().then(function(){
					console.log("Jitsi connected....");
					
					var joinRoom = isModerator? ConferenceService.connectModerator : ConferenceService.connectParticipant;
					
					joinRoom(res.roomName, res.roomPassword, params.userName, params.userId)
					.then(function (res){
					       isModerator && sendMeetingStartNotification(_ser_params);
					       meetingMemberEvents(params.meetingId, MEETING_EVENT_TYPES.MEMBER_EVENT_JOINED);
							blockUI.stop();
					      	deferred.resolve(res);
					      }, 
					      function (conErr){
					    	blockUI.stop();
							deferred.reject(conErr);
					      });
					     
				});
				
				
			}, function (error) {
				console.log("error join meeting request....");
				deferred.reject(error);
			}).finally(function () {
			});
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
		
		
		
		function sendMeetingStartNotification(notiParams) {
			var deferred = $q.defer();
			/*blockUI.start("Creating...", {
				status: 'isLoading'
			}); */
			DataProvider.resource.Meeting.notifyMeetingStart(notiParams)
			.then(function (res) {
				//blockUI.stop("Meeting Created Successfully...");
				deferred.resolve(res);
			}, function (error) {
				//blockUI.stop();
				deferred.reject(error);
			}).finally(function () {
			});
			return deferred.promise;
		}
		
		function leaveMeeting(params){
			
			var deferred = $q.defer();
			var _params = {
					catId : params.catId,
					catType : params.catType,
					meetingId : params.meetingId
				};
			
			meetingMemberEvents(params.meetingId, MEETING_EVENT_TYPES.MEMBER_EVENT_LEFT);
			ConferenceService.leaveConference();
			deferred.resolve();
			
		   if(params && params.isModerator){
				DataProvider.resource.Meeting.meetingEnd(_params).then(function(res){
					deferred.resolve(res);
				}, function (error) {
					deferred.reject(error);
				});
			}else{
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
		
		
		function endMeeting(params){
			
			var deferred = $q.defer();
			var _params = {
					catId : params.catId,
					catType : params.catType,
					meetingId : params.meetingId
				};
			
			ConferenceService.leaveAndEndConference();
			deferred.resolve();
			
			return deferred.promise;
		}
		
		function ownedMeetingsList(params) {
			var deferred = $q.defer();
			blockUI.start("Loading...", {
				status: 'isLoading'
			});
			DataProvider.resource.Meeting.ownedMeetingsList({
				catId: params.catId,  
				catType: params.catType
			}, { bypassCache: true, autoClose: false }).then(function(result) {
				return deferred.resolve(result);
			}).catch(function(err) {
				deferred.reject(err);
			}).finally(function () {
				blockUI.stop();
			});
			return deferred.promise;
		}
		function deleteMeetingDialog(listObj, params) {

			var deferred = $q.defer();
			var options = options || {};

			var _deferred = $q.defer(), DeleteMeetingDialogOptions;

			DeleteMeetingDialogOptions = {
					controller: ['$scope', '$mdDialog',DeleteMeetingController],
					templateUrl: 'app/modules/talk/meetingDelete.dialog.tpl.html',
					clickOutsideToClose:false,
					selectAllText: LANG.LABEL.SELECT_ALL,
					actionButtonText: "Delete",
					cancelButtonText: "Cancel" 
			};

			Dialog.show(DeleteMeetingDialogOptions)

			.then(function (res) {
				_deferred.resolve(res);
			})
			.catch(function (err) {
				_deferred.reject(err);
			})
			.finally(function () {
			});

			return _deferred.promise;

			function DeleteMeetingController($scope, $mdDialog) {
				var multiSelectList = AppCoreUtilityServices.multiSelectScopeControllerFactory(listObj);
				var isActionInProgress = false;
				angular.extend($scope, {
					listObj: listObj,
					config: DeleteMeetingDialogOptions,
					cancel: function () {
						$mdDialog.hide();
					},
					multiSelectList: multiSelectList,
					action: function () {
						if (isActionInProgress)
							return;
						if (multiSelectList.getItems(true).length == 0) {
							return;
						}
						isActionInProgress = true;
						blockUI.start("Deleting...");
						DataProvider.resource.Meeting.ownedMeetingsDelete(multiSelectList.getItems(true),params)
						.then(function (res) {
							$mdDialog.hide(res);
						})
						.catch(function (err) {
							$mdDialog.cancel(err)
						})
						.finally(function () {
							isActionInProgress = false;
							blockUI.stop();
						})
					}
				});
			}
		}
		
		function getMeetingMembers(meetingObj){
			prepareParticipantsList(meetingObj);
			return _self.participants_KV;
		}
		
		function prepareParticipantsList(meetingObj){
			_self.participantsList = [ ];
			_self.participants_KV = {};

			for(var i = 0; i < meetingObj.members.length; i++){
				var participant = {};
				participant.id = meetingObj.members[i].id;
				participant.displayName = meetingObj.members[i].userFirstName+"_"+meetingObj.members[i].userLastName;
				participant.userName = meetingObj.members[i].userFirstName+" "+meetingObj.members[i].userLastName;
				participant.hasJoined = false;
				
				_self.participantsList.push(participant);	

				_self.participants_KV[''+participant.id] = {};
				_self.participants_KV[''+participant.id].details = participant;
			}
		}
		
		function updateMemberJoinedStatus(userId, isMemberJoined){
			
			$scope.participant_KV[""+userId].details.hasJoined = isMemberJoined;
			
			for(var i = 0; i < $scope.participantsList.length; i++){
				if(userId == (""+$scope.participantsList[i].id)){
					$scope.participantsList[i].hasJoined = isMemberJoined;
					return;
				}
			}
		}
		
		
		function removeParticipantFromMeeting(roomUserId){
			
			ConferenceService.kickUser(roomUserId);
		}
		
		function leaveMeetingOnUserKick(){
			ConferenceService.leaveConference();
		}
		
		function muteUser(){
			ConferenceService.muteLocalUser();
		}
		
		function unmuteUser(){
			ConferenceService.unmuteLocalUser();
		}
		
		function getMeetingInfo(params){
			var deferred = $q.defer();
			
			DataProvider.resource.Meeting.meetingView(params).then(function(resp){
				
				deferred.resolve(resp);
			},
			function(err){
				deferred.reject(err)
			});
			
			return deferred.promise;
		}
		
		
		
		
		function startAdhocMeeting(meetingObj) {
			var deferred = $q.defer(), 
			catId = meetingObj.catId,
			startAdhocMeetingDailogOptions;
			
			var _joinMeeting = joinMeeting;
			
			startAdhocMeetingDailogOptions = {
					controller: ['$scope', '$stateParams', '$mdDialog', 'blockUI', 'mDialog',  
					             'MEETING_TYPES', 'CATEGORY_TYPE','$mdToast', 'CONFERENCE_BROADCAST',
                                 '$rootScope','AppCoreUtilityServices','$timeout','MEETING_CUSTOM_COMMANDS', StartAdhocMeetingController],
					templateUrl: 'app/modules/talk/joinedMeeting.dialog.tpl.html',
					clickOutsideToClose:false
			}
			
			Dialog.show(startAdhocMeetingDailogOptions)
			.then(function (res) {
				deferred.resolve(res)
			})
			.catch(function (err) {
				deferred.reject(err);
			})
			.finally(function () {
			});
			return deferred.promise;
			
			
			function StartAdhocMeetingController($scope, $stateParams, $mdDialog, blockUI, mDialog, 
					 MEETING_TYPES, CATEGORY_TYPE, $mdToast, CONFERENCE_BROADCAST,
                     $rootScope, AppCoreUtilityServices, $timeout, MEETING_CUSTOM_COMMANDS) {
				
				
				$scope.isMeetingInProgress = false; 
				$scope.meetingInfo = {};
				$scope.isModerator = false;
				$scope.participantsList = [ ];
				$scope.participant_KV = {};
				$scope.isUserMuted = false;
				$scope.userId = userId;
				$scope.MU = AppCoreUtilityServices;
				$scope.audioOPDevicesList = [ ];
				$scope.volumeLevel = 0;
				$scope.showMeetingPrompt = false;
				
				$scope.addMember = {
						sendToAll : false,
						members : []
				};
				
				$scope.isModerator = !!meetingObj.isModerator;
				
				$scope.close = function () {
					$mdDialog.hide();
				}
				
				var meetingEndPromptInterval = null;
				var meetingTimeout = null;
				var PROMPT_DEFAULT_MINS = 2;
				
				$scope.joinMeeting = function(meetingObj){
					
					prepareParticipantsList(meetingObj);

					var params = {
							catType : meetingObj.catType,
							catId : catId,
							meetingId: meetingObj.id,
							userId : $scope.userId,
							roomName : meetingObj.roomName,
							roomPassword : meetingObj.roomPassword
					};

					$scope.meetingInfo = meetingObj;
					
					if(!$scope.isModerator){
						$scope.isModerator = ($scope.userId == meetingObj.moderator.id) ? true : false;
						$scope.forceModerator = true;
					}
					
					params.isModerator = $scope.isModerator;
					params.userName = $scope.isModerator? meetingObj.moderator.userFirstName+"_"+meetingObj.moderator.userLastName
							: $scope.participant_KV[''+$scope.userId].details.displayName;
					
					updateMemberJoinedStatus($scope.userId, null, true);

					var joinMeetingService = ($scope.isModerator && !$scope.forceModerator)? joinModeratorToMeeting : joinMeeting;
					
					joinMeetingService(params).then(function (res) {

						$scope.isMeetingInProgress = true;
						updateMemberJoinedStatus($scope.userId, null, true);
						$scope.isModerator && _runMeetingTimer($scope.meetingInfo.endTime, PROMPT_DEFAULT_MINS);

					}, function (error) {
						console.log("error join meeting request....");
						//showMessageWithCloseDelay(error.respMsg);
						
						$timeout(function() { 
							blockUI.stop(); 
							Dialog.alert({
								content: error.respMsg,
								ok: "Ok"
							});
//							$scope.close();
							
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
						$scope.addMember.members = [];
						var _params = {
								catId: meetingObj.catId,
								catType: meetingObj.catType,
								meetingId: meetingObj.id
						};
						blockUI.start("Loading...", {
							status: 'isLoading'
						});
						DataProvider.resource.Meeting.memberSearch(_params, {bypassCache: true,autoClose: false}).then(function(members) {
							if (members.length == 0) {
								blockUI.stop("No Members found", {
									status: 'isError',
									action: LANG.BUTTON.OK
								}); 
								$scope.addMember = {
										sendToAll : false,
										members : []
								};
							} else {
								blockUI.stop();
							}
							angular.forEach(members, function(member, key) {
								var index = _.findIndex($scope.addMember.members, member);
								if (index == -1) {
									$scope.addMember.members.push(member);
							}
							});
						}).catch(function() {
							blockUI.stop();
						}).finally(function () {
						});
					} else{
						$scope.addMember.members = [];
					}
				}
				
				$scope.removeSelectedMember =  function (user) {
					_.remove($scope.addMember.members, {
						id: user.id
					});
					$scope.addMember.sendToAll = false;
				}
				
				$scope.addingMembersToMeeting = function(){
					var deferred = $q.defer();
					blockUI.start("Loading...", {
						status: 'isLoading'
					});
					var members = [];
					angular.forEach($scope.addMember.members, function(invitee, key) {
						members.push(invitee.id)
						
						var participant = {};
						participant.id = invitee.id;
						participant.userFirstName = invitee.userFirstName;
						participant.userLastName = invitee.userLastName;
						participant.displayName = invitee.userFirstName+"_"+invitee.userLastName;
						participant.userName = invitee.userFirstName+" "+invitee.userLastName;
						participant.hasJoined = false;
						
						ConferenceService.newParticipantListener(MEETING_CUSTOM_COMMANDS.NEW_MEMBER_ADDED, {
								attributes : participant
						});
					});
					var _params = {
							catId: meetingObj.catId,
							catType: meetingObj.catType,
							id: meetingObj.id,
							members : members
					};
					DataProvider.resource.Meeting.addMembers(_params, {bypassCache: true,autoClose: false}).then(function(result) {
						$scope.addMember = {
								sendToAll : false,
								members : []
						};
						return deferred.resolve(result);
					}).catch(function() {
						deferred.reject();
					}).finally(function () {
						blockUI.stop();
					});
					return deferred.promise;
				}
				
				$scope.memberSearch = {
						selection: null,
						searchText: "",
						selectedItemChange: function(user) {
							if (user) {
								delete user.$$hashKey;
								var index = _.findIndex($scope.addMember.members, user);
								if (index == -1) {
									$scope.addMember.members.push(user);
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
									meetingId: meetingObj.id,
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
					participant.id = meetingObj.moderator.id;
					participant.displayName = meetingObj.moderator.userFirstName+"_"+meetingObj.moderator.userLastName;
					participant.userName = meetingObj.moderator.userFirstName+" "+meetingObj.moderator.userLastName;
					participant.hasJoined = false;
					$scope.participantsList.push(participant);	
					$scope.participant_KV[''+participant.id] = {};
					$scope.participant_KV[''+participant.id].details = participant;
					
					
					for(var i = 0; i < meetingObj.members.length; i++){
						var participant = {};
						participant.id = meetingObj.members[i].id;
						participant.displayName = meetingObj.members[i].userFirstName+"_"+meetingObj.members[i].userLastName;
						participant.userName = meetingObj.members[i].userFirstName+" "+meetingObj.members[i].userLastName;
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
					
					$scope.participantsList = [ ];
					$scope.participant_KV = {};
					
					//$mdDialog.hide();
				}
				
				$scope.leaveMeeting = function(meetingObj){
					var params = {
							catType : meetingObj.catType,
							catId : catId,
							meetingId: meetingObj.id,
							isModerator : $scope.isModerator
					};


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
						
					}).catch(function (err) {
						
					}).finally(function () {
						//refreshAfterLeaveMeeting();
					});

				};
				
				
				$scope.removeParticipantFromMeeting = function(roomUserId, meetingId, participantId) {

					ConferenceService.newParticipantListener(MEETING_CUSTOM_COMMANDS.MEMBER_REMOVED, {
						attributes : {userId : participantId}
					});

					if (meetingId) {
						meetingMemberEvents(meetingId, MEETING_EVENT_TYPES.MEMBER_EVENT_REMOVED, participantId);	
					}
					
					deleteParticipantFromList(participantId)
					removeParticipantFromMeeting(roomUserId);
				};
				
				$scope.toggleMuteUser = function(toggleVal){
					
					if(!!toggleVal){
						muteUser();
					}else{
						unmuteUser();
					}
				};
				
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
							status: 'isError'
						}); 
						
						$scope.close();
						
					}, 8000);
				}
				
				function deleteParticipantFromList(userId){
					delete $scope.participant_KV[""+userId];

					for(var i = 0; i < $scope.participantsList.length; i++){
						if(userId == (""+$scope.participantsList[i].id)){
							$scope.participantsList.splice(i,1);
						}
					}

					for(var i = 0; i < $scope.meetingInfo.members.length; i++){
						if(userId == ($scope.meetingInfo.members[i].id)){
							$scope.meetingInfo.members.splice(i,1);
//							meetingObj.members.splice(i,1);
						}
					}

				}
				
				$rootScope.$on(CONFERENCE_BROADCAST.PARTICIPANT_JOINED, function(event, args){
					console.log("invoked participant joined ======================> "+args.userDetails._displayName);
					var joinedUserDetails = angular.extend({},args.userDetails); 
					var joinedUserId = joinedUserDetails._displayName.split("@@")[1];
					var conferenceParticipantId = args.conferenceParticipantId;
					console.log("invoked participant user Id ======================> "+joinedUserId+"  conferenceParticipantId===> "+conferenceParticipantId);
					
					$scope.$apply(function() {
						updateMemberJoinedStatus(joinedUserId, conferenceParticipantId, true);
					});
					
				});
				
				$rootScope.$on(MEETING_CUSTOM_COMMANDS.MEMBER_REMOVED, function(event, args){
					console.log("MEETING_CUSTOM_COMMANDS.MEMBER_REMOVED jitsi command ======================> "+angular.toJson(args.userDetails.attributes));
					var id = parseInt(args.userDetails.attributes.userId);
					deleteParticipantFromList(id);
				});
				
				$rootScope.$on(MEETING_CUSTOM_COMMANDS.NEW_MEMBER_ADDED, function(event, args){
					console.log("MEETING_CUSTOM_COMMANDS.NEW_MEMBER_ADDED jitsi command ======================> "+angular.toJson(args.userDetails.attributes));
					var obj = args.userDetails.attributes;
					obj.id = parseInt(args.userDetails.attributes.id);
					obj.hasJoined = (obj.hasJoined === 'true');
					
					delete obj.$$hashKey;
					$scope.$apply(function() {
						var index1 = _.findIndex($scope.meetingInfo.members, {"id":obj.id});
						if (index1 == -1) {
							$scope.meetingInfo.members.push(obj);
						}
						var index2 = _.findIndex($scope.participantsList, obj);
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
					console.log("invoked LOCAL_PARTICIPANT_KICKED ======");
					leaveMeetingOnUserKick();
					refreshAfterLeaveMeeting();
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
					
					blockUI.start("Extending meeting end time by 10 mins...", {
						status: 'isLoading'
					});
					
					var _params = {
							id: meetingId,
							endTime: endTime+(2*60000)
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
				
				
				
				$scope.joinMeeting(meetingObj);
			}
			
			
		}
		
		
		function roomStatus(params) {
			var deferred = $q.defer();
			
			DataProvider.resource.Meeting.roomStatus(params).then(function(resp){

				deferred.resolve(resp);
			},
			function(err){
				deferred.reject(err)
			});

			return deferred.promise;
		}
		
		
		function _createMeeting(meetingModel) {
			var deferred = $q.defer();
			DataProvider.resource.Meeting.meetingCreate(meetingModel)
			.then(function (res) {
				deferred.resolve(res);
			}, function (error) {
				deferred.reject(error);
			}).finally(function () {
			});
			return deferred.promise;
		}
		
		function _toJoinMeeting(meetingModel) {
			var deferred = $q.defer();
			DataProvider.resource.Meeting.meetingJoin(meetingModel)
			.then(function (res) {
				deferred.resolve(res);
			}, function (error) {
				deferred.reject(error);
			}).finally(function () {
			});
			return deferred.promise;
		}
		
		return {
			createMeeting : _createMeeting,
			CreateAdhocMeeting : CreateAdhocMeeting,
			meetingStatus: meetingStatus,
			startAdhocMeeting : startAdhocMeeting,
			joinModeratorToMeeting : joinModeratorToMeeting,
			joinMeeting : joinMeeting,
			sendMeetingStartNotification : sendMeetingStartNotification,
			leaveMeeting : leaveMeeting,
			endMeeting : endMeeting,
			deleteMeetingDialog : deleteMeetingDialog,
			ownedMeetingsList : ownedMeetingsList,
			getMeetingMembers : getMeetingMembers,
			removeParticipantFromMeeting : removeParticipantFromMeeting,
			leaveMeetingOnUserKick : leaveMeetingOnUserKick,
			muteUser : muteUser,
			unmuteUser : unmuteUser,
			getMeetingInfo : getMeetingInfo,
			roomStatus:roomStatus,
			toJoinMeeting:_toJoinMeeting
		}
	}
})();