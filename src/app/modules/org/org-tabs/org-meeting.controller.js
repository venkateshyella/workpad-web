/**
 * Created by sandeep on 24/11/16.
 */
;
(function() {
	"use strict";
	angular.module('app')
	.filter('meetingStatus', function() {
	  })
	.controller('OrgMeetingViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog', '$timeout', 
	                                         'Lang', 'Session','$controller','meetingService','OrganisationService',
	                                         'MEETING_TYPES', 'CATEGORY_TYPE','$mdToast', 'CONFERENCE_BROADCAST',
	                                         'URL','$q','State','AuditService','$rootScope','MEETING_VIEW_EVENTS',
	                                         'EVENT_TYPE','ROOM_STATUS','MEETING_MESSAGES', OrgMeetingViewController])
	                                        
	                                         
	function OrgMeetingViewController($scope, $stateParams, blockUI, DataProvider, Dialog, $timeout,
			                          Lang, Session, $controller, meetingService, OrganisationService,
			                          MEETING_TYPES, CATEGORY_TYPE, $mdToast, CONFERENCE_BROADCAST, 
			                          URL, $q, State, AuditService, $rootScope, MEETING_VIEW_EVENTS,
			                          EVENT_TYPE, ROOM_STATUS, MEETING_MESSAGES) {
		var LANG = Lang.en.data
		, orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId
		, _rawResponse
		, orgMeetingAuditPageLoader
		, orgMeetingAuditLoader
		, orgMeetingCollection = []
		, meetingId = $stateParams.meetingId
		, adhocMeetingDefaultEndTime = 60;
		;
		$scope.sharedData.sideMenu.currItem = 'my_orgs';
		console.log("In Org OrgMeetingViewController controller");
		$scope.userId = Session.userId;
		$scope.currentOrgId = orgId;
		$scope.CATEGORY_TYPE = CATEGORY_TYPE;
		
		$scope.pollOptions = {
				endPointParams: { orgId: $stateParams.orgId,
					catId: $stateParams.orgId,
					catType: CATEGORY_TYPE.ORG
				},
				endPointUrl: URL.ROOM_STATUS
		};
		
		
		function _init() {
			angular.extend(self, $controller('ViewDataBaseController', {
				$scope: $scope
			}));
			$scope.xtras.selectedTabIndex = 4;
			$scope.isNextPageAvailable = false;
			$scope.loadingNext = false;
			$scope.OrgMeetingsData = {
					orgMeetings: [],
					pgInfo: {
						pageSize: 25,
						currPage: 1
					}
			};
			$scope.orgMeetingsAuditList = [];
			$scope.orgTabCtrl.orgModel = DataProvider.resource.Organisation.get(orgId);
			/**
			 * org meetings audits
			 */
			orgMeetingAuditPageLoader = OrganisationService.createOrgMeetingsAuditListLoader(orgId, orgMeetingCollection);
			orgMeetingAuditLoader = self.initializeViewDataBaseController('orgMeetingsAudit',
					function () {
				return orgMeetingAuditPageLoader.fn()
				.then(function (audits) {
					"use strict";
					$scope.orgMeetingsAuditList = _.uniq($scope.orgMeetingsAuditList.concat(audits));
					return $scope.orgMeetingsAuditList;
				});
			});
			$scope.ui.auditActivityStore = orgMeetingAuditPageLoader.getActivityStore(); 
			$scope.loadNext = loadNext;
			$scope.toggleAudit = toggleAudit;
			$scope.isNextAuditPageAvailable = isNextAuditPageAvailable;
			$scope.fetchMoreAudits = fetchMoreAudits;
			$scope.toggleMeetingMembers = toggleMeetingMembers;
//			$scope.meetingStatus = meetingService.meetingStatus;
			$scope.editMeeting = editMeeting;

//			$scope.isMeetingInProgress = false; 

//			$scope.meetingInfo = {};

//			$scope.isModerator = false;
//			$scope.participantsList = [ ];
//			$scope.participant_KV = {};
//			$scope.isUserMuted = false;
			
			$scope.toggleScheduledMeetings = toggleScheduledMeetings;
			
			$scope.roomStatusInfo = null;
			$scope.ROOM_STATUS = ROOM_STATUS;
			$scope.adhocMembers = [];
			
			$scope.talkMeetingTypes = MEETING_TYPES;
			
			if($scope.meetingInfo && $scope.meetingInfo.catId ){
				var show = true;
				if(orgId != $scope.meetingInfo.catId){
					show = false;
				}
				$rootScope.$emit(MEETING_VIEW_EVENTS.SHOW_MEETING_OPTIONS, {isShown : show});
			}
				
			
		}
		_init();
		if ($scope.orgTabCtrl.orgModel) {
			initOrgMeetingsView();
		} else {
			$scope.getOrgDetails().then(function () {
				initOrgMeetingsView();
			});
		}
		function initOrgMeetingsView() {
			getMeetingTabMenuList();
//			getOrgMeetingsList();
			checkAdhocRoomStatus();
		}
		function getMeetingTabMenuList() {
			$scope.orgTabCtrl.optionMenuItems.TAB_TALK = [];
			var chatTabMenuItems = [
//			                        {
//				name: "Start Meeting",
//				action: clickOnMeeting,
//				isAllowed: true
//			},
			{
				name: "Audit",
				action: auditClicked,
				isAllowed: true
			}];
			
			/* {
				name: "Delete Meeting",
				action: deleteOrgMeeting,
				isAllowed: true
			} */
			
			$scope.state = {
					showAudit: false
			};
			angular.forEach(chatTabMenuItems, function(menuItem) {
				if (menuItem.isAllowed) {
					$scope.orgTabCtrl.optionMenuItems.TAB_TALK.push(menuItem);
				}
			});
		}
		function loadNext() {
			$scope.loadingNext = true;
			$scope.OrgMeetingsData.pgInfo.currPage += 1;
			getOrgMeetingsList();
		}
		function toggleAudit(enable) {
			$scope.state.showAudit = !!enable;
			if ($scope.state.showAudit) {
				resetAuditPagination();
				fetchAuditPage();
			} else {
				$scope.OrgMeetingsData = {
						orgMeetings: [],
						pgInfo: {
							pageSize: 25,
							currPage: 1
						}
				};
				getOrgMeetingsList();
			}
		}
		
		function toggleScheduledMeetings(enable){
			$scope.state.showScheduledMeetings = !!enable;
			if ($scope.state.showScheduledMeetings) {
				$scope.currentTIme= new Date().getTime();

				$scope.OrgMeetingsData = {
						orgMeetings: [],
						pgInfo: {
							pageSize: 25,
							currPage: 1
						}
				};
				
				getOrgMeetingsList();
			} else {
				checkAdhocRoomStatus();
			}
		}
		
		function checkAdhocRoomStatus() {
			var deferred = $q.defer();
			$scope.roomStatusInfo = null;
			blockUI.start("Loading...", {
				status: 'isLoading'
			});
			
			
			var params = { orgId: $stateParams.orgId,
  			      catId: $stateParams.orgId,
			      catType: CATEGORY_TYPE.ORG
			    };
			
			meetingService.roomStatus(params).then(function (res) {
				$scope.roomStatusInfo = res;
				if(($scope.roomStatusInfo.roomStatus == ROOM_STATUS.AVAILABLE) && $scope.showMeetingOpts){
					$scope.checkAndExitMeeting();
				}
				deferred.resolve();
			})
			.catch(function (err) {
				deferred.reject();
				Dialog.alert({
					content: err.respMsg,
					ok: "Ok"
				});
			}).finally(function () {
				blockUI.stop();
			});
			
			return deferred.promise;
		}
		
		
		function fetchAuditPage() {
			$scope.orgMeetingsAudit.refresh()
		}
		function isNextAuditPageAvailable() {
			return orgMeetingAuditPageLoader
			&& orgMeetingAuditPageLoader.isNextPageAvailable()
		}
		function fetchMoreAudits() {
			fetchAuditPage();
		}
		function resetAuditPagination() {
			$scope.orgMeetingsAuditList = [];
			orgMeetingAuditPageLoader.resetPagination();
		}
		function getOrgMeetingsList() {
			blockUI.start("Loading...", {
				status: 'isLoading'
			});
			var _params = {
					catId: $stateParams.orgId,
					catType:CATEGORY_TYPE.ORG,
					pageSize: $scope.OrgMeetingsData.pgInfo.pageSize,
					pageNumber: $scope.OrgMeetingsData.pgInfo.currPage,
					eventType:EVENT_TYPE.TALK
					
			};
			$scope.orgTabCtrl.orgModel.loadMeetings(_params).then(function (res) {
				$scope.loadingNext = false;
				var user = {
						id : $scope.userId
				}
				angular.forEach(res, function (value, key) {
					var index = _.findIndex(value.members, user);
					value.hasAccess = (index > -1) ? true : false;
					
					value.catId = $stateParams.orgId;
					value.catType = CATEGORY_TYPE.ORG;
					
					$scope.OrgMeetingsData.orgMeetings.push(value);
				});
				$timeout();
				checkNextPgAvailability();
				
			}, null, function (rawResponse) {
				_rawResponse = rawResponse;
			}).catch(function (error) {
				Dialog.alert({
					content: error.respMsg,
					ok: "Ok"
				});
			}).finally(function () {
				blockUI.stop();
			});
		}
		function checkNextPgAvailability() {
			var totalResults = _rawResponse.resp.paginationMetaData.totalResults;
			if ($scope.OrgMeetingsData.orgMeetings.length < totalResults) {
				$scope.isNextPageAvailable = true;
			} else {
				$scope.isNextPageAvailable = false;
			}
		}
		

		function auditClicked() {
			var params = {};
			params.catId = $stateParams.orgId;
			params.catType = CATEGORY_TYPE.ORG;

			blockUI.start("Fetching Audit data");
			AuditService.checkAuditList(URL.MEETING_AUDIT,params).then(function (res) {
				if (res.results.length > 0) {
					var title = "";
					blockUI.stop();

					AuditService.showAudit(URL.MEETING_AUDIT,params,title, res).then(function (res) {

					}).catch(function (err) {
						Dialog.alert({
							content: err.message,
							ok: "Ok"
						});
					});
				} else{
					blockUI.stop("No Audits available", {
						status: 'isSuccess',
						action: LANG.BUTTON.OK
					})
				}
			})
			.catch(function (err) {
				Dialog.alert({
					content: err.message,
					ok: "Ok"
				});
			}).finally(function () {
				blockUI.stop();
			});
		}
		
		function clickOnMeeting(meetingObj) {
			var params = {
					catType : CATEGORY_TYPE.ORG,
					catId : orgId,
					meetingType:meetingObj.type,
					eventId:meetingObj.eventId,
					startTime:meetingObj.startTime,
					endTime:meetingObj.endTime
			}
			meetingService.CreateAdhocMeeting(params).then(function (res) {
				if (res.isSuccess) {
					//toggleAudit(false);	
					$scope.startMeeting(res.resp);
				}
			}).catch(function (err) {
				Dialog.alert({
					content: err.respMsg,
					ok: "Ok"
				});
			}).finally(function () {
			});
		}
		function editMeeting(model) {
			var formModel = {}, members = [];
			formModel.members = [];
			angular.extend(formModel,model);
			angular.extend(members,model.members);
			formModel.members = members;
			formModel.orgId = orgId;
			formModel.catType = CATEGORY_TYPE.ORG;
			formModel.catId = orgId;
			formModel.meetingType=-102;
			meetingService.CreateAdhocMeeting(formModel).then(function (res) {
				if (res.isSuccess) {
					toggleAudit(false);	
				}
			}).catch(function (err) {
				Dialog.alert({
					content: err.respMsg,
					ok: "Ok"
				});
			}).finally(function () {
			});
		}
		$scope.viewMembersFlagMeta = {};
		function toggleMeetingMembers(event) {
			$scope.viewMembersFlagMeta[event] = !$scope.viewMembersFlagMeta[event];
		}
		function deleteOrgMeeting() {
			var params = {};
			params.catId = $stateParams.orgId;
			params.catType = CATEGORY_TYPE.ORG;
			blockUI.start("Loading...");
			meetingService.ownedMeetingsList(params).then(function (res) {
				if (res.resp.length > 0) {
					blockUI.stop();
					meetingService.deleteMeetingDialog(res.resp, params).then(function (res) {
						if (res && res.responseCode == 0) {
							$scope.OrgMeetingsData.orgMeetings = [];
							getOrgMeetingsList();
							var toast = $mdToast.simple()
							.content("Deleted successfully")
							.position('bottom right')
							.hideDelay(3000);
							$mdToast.show(toast)
							.then(function (res) {
							});
						}
					}).catch(function (err) {
						Dialog.alert({
							content: err.respMsg,
							ok: "Ok"
						});
					});
				} else {
					blockUI.stop("No Meetings available", {
						status: 'isSuccess',
						action: LANG.BUTTON.OK
					})
				}
			}).catch(function (err) {
				Dialog.alert({
					content: err.respMsg,
					ok: "Ok"
				});
			}).finally(function () {
				blockUI.stop();
			});
		}
		
		function checkOtherMeetingInProgress(){
			var isOtherMeetingRunning = false;
			if(!$scope.showMeetingOpts){
				Dialog.alert({
					content: MEETING_MESSAGES.OTHER_ORG_MEETING_INPROGRESS,
					ok: "Ok"
				});
				isOtherMeetingRunning = true;
			}
			 return isOtherMeetingRunning;
		}
		
		$scope.joinMeeting = function(meetingObj){
			var deferred = $q.defer();
			
			meetingObj.catId = orgId;
			meetingObj.catType = CATEGORY_TYPE.ORG;
			meetingService.startAdhocMeeting(meetingObj).then(function (res) {
			},
			function (err) {
				Dialog.alert({
					content: err.respMsg,
					ok: "Ok"
				});
			}).catch(function (err) {
				Dialog.alert({
					content: err.respMsg,
					ok: "Ok"
				});
			}).finally(function () {
				toggleAudit(false);
				deferred.resolve();
			});
			
			return deferred.promise;
		};
		
		
		$scope.addAllMembersToAdhocMeeting = function(catIdParam, catTypeParam){
			var deferred = $q.defer();
			$scope.adhocMembers = [];
			var _params = {
					catId: catIdParam,
					catType: catTypeParam,
			};

			DataProvider.resource.Meeting.memberSearch(_params, {bypassCache: true,autoClose: false}).then(function(members) {
				angular.forEach(members, function(member, key) {
					var index = _.findIndex($scope.adhocMembers, member);
					if (index == -1) {
						$scope.adhocMembers.push(member);
					}
				});
				
				deferred.resolve();
			});
			
			return deferred.promise;
		}; 
		
		
		$scope.startAdhocMeeting = function(){
			
			if(checkOtherMeetingInProgress()){
				return;
			}
			
			var deferred = $q.defer();
			
			function _proceedStart(){
				
				var adhocMeetingModel = {};
				adhocMeetingModel.catId = orgId;
				adhocMeetingModel.catType = CATEGORY_TYPE.ORG;
				adhocMeetingModel.startTime = new Date().getTime();
				adhocMeetingModel.endTime = prepareMeetingEndTime(adhocMeetingModel.startTime, 0, adhocMeetingDefaultEndTime);
				adhocMeetingModel.meetingType = MEETING_TYPES.ADHOC;

				meetingService.createMeeting(adhocMeetingModel).then(function (res) {
					if (res && res.responseCode == 0){
						adhocMeetingModel.isModerator = true;
						adhocMeetingModel.roomName = res.resp.roomName;
						adhocMeetingModel.roomPassword = res.resp.roomPassword;
						adhocMeetingModel.moderator = Session.userInfo;
						adhocMeetingModel.owner = Session.userInfo;
						adhocMeetingModel.meetingId = res.resp.id;
						
						if(res.resp.endTime && (adhocMeetingModel.endTime != res.resp.endTime)){
							adhocMeetingModel.endTimeIntesectDifference = adhocMeetingModel.endTime - res.resp.endTime;
							adhocMeetingModel.endTime = res.resp.endTime; 
							adhocMeetingModel.isEndTimeIntersects  = true;
						}else{
							adhocMeetingModel.isEndTimeIntersects  = false;
						}
						  							
						//$scope.addAllMembersToAdhocMeeting(adhocMeetingModel.catId, adhocMeetingModel.catType)
						meetingService.getMeetingInfo({id: adhocMeetingModel.meetingId}).then(function(meetingInfoRes){
							adhocMeetingModel.members = angular.extend([], meetingInfoRes.members);
							adhocMeetingModel.attendees = meetingInfoRes.members;
							adhocMeetingModel.orgId = $stateParams.orgId;
							adhocMeetingModel.groupId = null;
							$rootScope.$emit(MEETING_VIEW_EVENTS.START_MEETING, {meetingInfo : adhocMeetingModel});
							checkAdhocRoomStatus();
						});

					}else{
						Dialog.alert({
							content: res.responseMessage,
							ok: "Ok"
						});
					} 

					blockUI.stop();
				},
				function (err) {
					Dialog.alert({
						content: err.respMsg,
						ok: "Ok"
					});
					blockUI.stop();
				}).catch(function (err) {
					Dialog.alert({
						content: err.respMsg,
						ok: "Ok"
					});
					blockUI.stop();
				}).finally(function () {
					blockUI.stop();
					deferred.resolve();
				});

			}
			
			checkAdhocRoomStatus().then(function(){
				if(ROOM_STATUS.AVAILABLE == $scope.roomStatusInfo.roomStatus){
					blockUI.start("Loading...", {
						status: 'isLoading'
					});
					_proceedStart();
				}else if(ROOM_STATUS.BUSY == $scope.roomStatusInfo.roomStatus && $scope.roomStatusInfo.meeting != null){
					$scope.joinAdhocMeeting();
				}
			});
		
			return deferred.promise;
			
		};
		
		
		$scope.joinAdhocMeeting = function(){
			
			blockUI.start("Loading...", {
				status: 'isLoading'
			});
			
			meetingService.getMeetingInfo({id: $scope.roomStatusInfo.meeting.id})
			.then(function (response) {
				_proceedJoin(response);
				blockUI.stop();
			},
			function (err) {
				blockUI.stop();
				//if(err.responseCode == 5){
					/*
					var members = [];
					members.push($scope.userId)
					var _params = {
							catId: orgId,
							catType: CATEGORY_TYPE.ORG,
							id: $scope.roomStatusInfo.meeting.id,
							members : members
					};
					DataProvider.resource.Meeting.addMembers(_params, {bypassCache: true,autoClose: false}).then(function(result) {
						meetingService.getMeetingInfo({id: $scope.roomStatusInfo.meeting.id})
						.then(function (response) {
							_proceedJoin(response);
							blockUI.stop();
						});
					});
					*/
				//}else{
					Dialog.alert({
						content: err.respMsg,
						ok: "Ok"
					});
				//}
				
			}).catch(function (err) {
				blockUI.stop();
				Dialog.alert({
					content: err.respMsg,
					ok: "Ok"
				});
			});
			
			function _proceedJoin(meetingInfoParam){
				
			

				var adhocMeetingModel = {};
				adhocMeetingModel.catId = orgId;
				adhocMeetingModel.catType = CATEGORY_TYPE.ORG;
				adhocMeetingModel.startTime = $scope.roomStatusInfo.meeting.startTime;
				adhocMeetingModel.endTime = $scope.roomStatusInfo.meeting.endTime;//prepareMeetingEndTime(adhocMeetingModel.startTime, 0, adhocMeetingDefaultEndTime);
				adhocMeetingModel.meetingType = MEETING_TYPES.ADHOC;

				adhocMeetingModel.isModerator = false;
				
				if($scope.roomStatusInfo.meeting.ownerId == $scope.userId && $scope.showMeetingOpts){
					adhocMeetingModel.isModerator = true;
				}
				
				adhocMeetingModel.roomName = $scope.roomStatusInfo.meeting.roomName;
				adhocMeetingModel.roomPassword = $scope.roomStatusInfo.meeting.roomPassword;
				adhocMeetingModel.moderator = meetingInfoParam.moderator;
				adhocMeetingModel.owner = meetingInfoParam.moderator;
				adhocMeetingModel.meetingId = $scope.roomStatusInfo.meeting.id;

				//$scope.addAllMembersToAdhocMeeting(adhocMeetingModel.catId, adhocMeetingModel.catType).then(function(){
					adhocMeetingModel.members = angular.extend([], meetingInfoParam.members);
					adhocMeetingModel.attendees = meetingInfoParam.members;
					adhocMeetingModel.orgId = $stateParams.orgId;
					adhocMeetingModel.groupId = null;

					var ind = _.findIndex(meetingInfoParam.attendees, {"id":$scope.userId});
					if(ind == -1){
						adhocMeetingModel.members.push(Session.userInfo);
						adhocMeetingModel.attendees.push(Session.userInfo);
						adhocMeetingModel.isNewMember = true;
						adhocMeetingModel.newMemberInfo = Session.userInfo;
					}
					
					$rootScope.$emit(MEETING_VIEW_EVENTS.START_MEETING, {meetingInfo : adhocMeetingModel});
					checkAdhocRoomStatus();
				//});
			}
		};
		
		function prepareMeetingEndTime(startTime, hrs, mins) {
			var d = new Date(startTime);
			d.setHours(d.getHours() + hrs);
			d.setMinutes(d.getMinutes() + mins);
			return d.getTime();
		}
		
		$scope.startMeeting = function(meetingObj){
			
			var deferred = $q.defer();
			
			meetingObj.orgId = orgId;
			meetingObj.isModerator = true;
			
			meetingService.startAdhocMeeting(meetingObj).then(function (res) {
				toggleAudit(false);
			},
			function (err) {
				Dialog.alert({
					content: err.respMsg,
					ok: "Ok"
				});
			}).catch(function (err) {
				Dialog.alert({
					content: err.respMsg,
					ok: "Ok"
				});
			}).finally(function () {
				toggleAudit(false);
				deferred.resolve();
			});
			
			return deferred.promise;
		};
		
		$scope.startScheduledMeeting = function(meetingObj){
			
			if ($scope.isMeetingInProgress) {
				Dialog.alert({
					content: "Cannot start meeting. Meeting is in progress in another WorkSpace or Room.",
					ok: "Ok"
				});	
			} else {
				blockUI.start("Loading...");
				
				var obj = {
						catType : CATEGORY_TYPE.ORG,
						catId : orgId,
						meetingType:MEETING_TYPES.SCHEDULED,
						eventId:meetingObj.eventId,
						startTime:meetingObj.startTime,
						endTime:meetingObj.endTime
						}
				
				meetingService.createMeeting(obj).then(function (res) {
					meetingObj.roomName = res.resp.roomName;
					meetingObj.roomPassword = res.resp.roomPassword;
//					meetingObj.catType = CATEGORY_TYPE.ORG;
//					meetingObj.catId = orgId;
					meetingObj.isModerator = ($scope.userId == meetingObj.owner.id) ? true : false;
					meetingObj.owner = meetingObj.owner;
					meetingObj.attendess = meetingObj.attendees;
					meetingObj.meetingId = res.resp.id;
					
					meetingObj.orgId = $stateParams.orgId;
					meetingObj.groupId = null;
					
					//$scope.startMeeting(meetingObj);	
					$scope.state.showScheduledMeetings = false;
					$rootScope.$emit(MEETING_VIEW_EVENTS.START_MEETING, {meetingInfo : meetingObj});
					checkAdhocRoomStatus();
				})
				.catch(function (err) {
					var msg;
					if (err.message) {
						msg = err.message;
					}
					if (err.respMsg) {
						msg = err.respMsg;
					}
					Dialog.alert({
						content: msg,
						ok: "Ok"
					});
				}).finally(function () {
					blockUI.stop();
				});
			}
		};
		
		
		$scope.joinScheduledMeeting = function(meetingObj){
			
			if ($scope.isMeetingInProgress) {
				Dialog.alert({
					content: "Cannot start meeting. Meeting is in progress in another WorkSpace or Room.",
					ok: "Ok"
				});	
			} else {
				blockUI.start("Loading...");
				var obj = {
						catType : CATEGORY_TYPE.ORG,
						catId : orgId,
						meetingId:meetingObj.meetingId,
				}

				meetingService.toJoinMeeting(obj).then(function (res) {
					meetingObj.roomName = res.roomName;
					meetingObj.roomPassword = res.roomPassword;
//					meetingObj.catType = CATEGORY_TYPE.ORG;
//					meetingObj.catId = orgId;
					meetingObj.owner = meetingObj.owner;
					meetingObj.attendess = meetingObj.attendees;
					meetingObj.isModerator = ($scope.userId == meetingObj.owner.id) ? true : false;
					$scope.state.showScheduledMeetings = false;
					meetingObj.orgId = $stateParams.orgId;
					meetingObj.groupId = null;
					
					
					$rootScope.$emit(MEETING_VIEW_EVENTS.START_MEETING, {meetingInfo : meetingObj});
					checkAdhocRoomStatus();
//					$scope.joinMeeting(meetingObj).then(function(){
//					});
				})
				.catch(function (err) {
					var msg;
					if (err.message) {
						msg = err.message;
					}
					if (err.respMsg) {
						msg = err.respMsg;
					}
					Dialog.alert({
						content: msg,
						ok: "Ok"
					});
				}).finally(function () {
					blockUI.stop();
				});	
			}
		
		}
		
		$scope.joinUserInConference = function(){

			if(!!meetingId){
				meetingService.getMeetingInfo({id: meetingId})
				.then(function (response) {
					$scope.joinMeeting(response).then(function(){
						State.transitionTo('root.app.org-dashboard.orgMeeting',{orgId : orgId}, {reload: true, inherit: false});
						
					});
				})
				.catch(function (error) {

				})
				.finally(function () {

				});
			}
			
			meetingId = null;

		};
		
		//!!meetingId && $scope.joinUserInConference();
		
		$rootScope.$on(MEETING_VIEW_EVENTS.END_MEETING, function(event, args){
			checkAdhocRoomStatus();
		});
		
	}
})();