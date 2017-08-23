;
(function() {
	"use strict";

	angular.module('app')
	.controller('GroupMeetingViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog', 
	                                           '$timeout', 'Lang', 'Session','$controller','meetingService',
	                                           'GroupService','CATEGORY_TYPE','$mdToast','$q','State', 'AuditService', 'URL','EVENT_TYPE',
	                                           'MEETING_TYPES','$rootScope','MEETING_VIEW_EVENTS','ROOM_STATUS', GroupMeetingViewController])

	function GroupMeetingViewController($scope, $stateParams, blockUI, DataProvider, Dialog, 
										$timeout, Lang, Session, $controller, meetingService, 
										GroupService, CATEGORY_TYPE, $mdToast, $q, State, AuditService, URL, EVENT_TYPE, MEETING_TYPES, $rootScope, MEETING_VIEW_EVENTS,ROOM_STATUS) {

		var LANG = Lang.en.data
		, orgId = $stateParams.orgId
		, groupId = $stateParams.groupId
		, _rawResponse
		, groupMeetingAuditPageLoader
		, groupMeetingAuditLoader
		, groupMeetingCollection = []
		, meetingId = $stateParams.meetingId
		, adhocMeetingDefaultEndTime = 60;
		$scope.userId = Session.userId;
		$scope.sharedData.sideMenu.currItem = 'my_orgs';
		$scope.currentGrpId = groupId;
		$scope.CATEGORY_TYPE = CATEGORY_TYPE;
		
		$scope.pollOptions = {
				endPointParams: { orgId: $stateParams.orgId,
			           catId: groupId,
			           catType: CATEGORY_TYPE.GROUP
			         },
				endPointUrl: URL.ROOM_STATUS
		};
		
		console.log("In Group Meeting controller");
		
		var adhocMeetStatusResp = {
				  responseMessage: "success",
				  responseCode: 0,
				  data: {
				    status: -204,
				    roomState: "Available",
				    meeting: null,
				    meetingType: -102
				  }
				};
		
		function _init() {
			angular.extend(self, $controller('ViewDataBaseController', {
				$scope: $scope
			}));
			$scope.currentTIme= new Date().getTime();
			if(!$scope.groupTabCtrl.groupModel.isSupportGroup){
	        	$scope.xtras.selectedTabIndex = 4;
	        }else{
	        	$scope.xtras.selectedTabIndex = 3;
	        }
			$scope.isNextPageAvailable = false;
			$scope.loadingNext = false;
			$scope.GroupMeetingsData = {
					groupMeetings: [],
					pgInfo: {
						pageSize: 25,
						currPage: 1
					}
			};
			$scope.groupMeetingsAuditList = [];
			$scope.groupTabCtrl.groupModel = DataProvider.resource.Group.get(groupId);
			/**
			 * org meetings audits
			 */
			groupMeetingAuditPageLoader = GroupService.creategroupMeetingsAuditListLoader(groupId, groupMeetingCollection);
			groupMeetingAuditLoader = self.initializeViewDataBaseController('groupMeetingsAudit',
					function () {
				return groupMeetingAuditPageLoader.fn()
				.then(function (audits) {
					"use strict";
					$scope.groupMeetingsAuditList = _.uniq($scope.groupMeetingsAuditList.concat(audits));
					return $scope.groupMeetingsAuditList;
				});
			});
			$scope.ui.auditActivityStore = groupMeetingAuditPageLoader.getActivityStore(); 
			$scope.loadNext = loadNext;
			$scope.toggleAudit = toggleAudit;
			$scope.isNextAuditPageAvailable = isNextAuditPageAvailable;
			$scope.fetchMoreAudits = fetchMoreAudits;
			$scope.toggleMeetingMembers = toggleMeetingMembers;
			$scope.meetingStatus = meetingService.meetingStatus;
			$scope.editMeeting = editMeeting;
			$scope.toggleScheduledMeetings = toggleScheduledMeetings;
			$scope.roomStatusInfo = null;
			$scope.ROOM_STATUS = ROOM_STATUS;
			$scope.adhocMembers = [];
			
			$scope.talkMeetingTypes = MEETING_TYPES;
			
			if($scope.meetingInfo && $scope.meetingInfo.catType && $scope.meetingInfo.catId){
				var show = true;
				if($scope.meetingInfo.catId != groupId){
					show = false;
				}
				$rootScope.$emit(MEETING_VIEW_EVENTS.SHOW_MEETING_OPTIONS, {isShown : show});
			}
			
			

		}
		_init();
		if ($scope.groupTabCtrl.groupModel && $scope.groupTabCtrl.orgModel) {
			initgroupMeetingsView();
		} else {
			$scope.getGroupModelAndOrgModel().then(function () {
				initgroupMeetingsView();
			});
		}
		function initgroupMeetingsView() {
			getMeetingTabMenuList();
//			getgroupMeetingsList();
			checkAdhocRoomStatus();
		}
		function getMeetingTabMenuList() {
			$scope.groupTabCtrl.optionMenuItems.TAB_TALK = [];
			var chatTabMenuItems = [
//			                        {
//				name: "Create Meeting",
//				action: clickOnMeeting,
//				isAllowed: true
//			}, 
			{
				name: "Audit",
				action: auditClicked,
				isAllowed: true
			}];
			
			/*
			 {
				name: "Delete Meeting",
				action: deleteOrgMeeting,
				isAllowed: true
			}
			 */
			$scope.state = {
					showAudit: false
			};
			angular.forEach(chatTabMenuItems, function(menuItem) {
				if (menuItem.isAllowed) {
					$scope.groupTabCtrl.optionMenuItems.TAB_TALK.push(menuItem);
				}
			});
		}
		function loadNext() {
			$scope.loadingNext = true;
			$scope.GroupMeetingsData.pgInfo.currPage += 1;
			getgroupMeetingsList();
		}

		function toggleScheduledMeetings(enable){
			$scope.state.showScheduledMeetings = !!enable;
			if ($scope.state.showScheduledMeetings) {
				$scope.GroupMeetingsData = {
						groupMeetings: [],
						pgInfo: {
							pageSize: 25,
							currPage: 1
						}
				};
				getgroupMeetingsList();
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
	  			           catId: groupId,
				           catType: CATEGORY_TYPE.GROUP
				         };
			
			meetingService.roomStatus(params).then(function (res) {
				$scope.roomStatusInfo = res;
				if(($scope.roomStatusInfo.roomStatus == ROOM_STATUS.AVAILABLE) && $scope.showMeetingOpts){
					$scope.checkAndExitMeeting();
				}
				deferred.resolve();
			})
			.catch(function (err) {
				Dialog.alert({
					content: err.respMsg,
					ok: "Ok"
				});
				deferred.reject();
			}).finally(function () {
				blockUI.stop();
			});
			return deferred.promise;
		}
		
		function toggleAudit(enable) {
			$scope.state.showAudit = !!enable;
			if ($scope.state.showAudit) {
				resetAuditPagination();
				fetchAuditPage();
			} else {
				$scope.GroupMeetingsData = {
						groupMeetings: [],
						pgInfo: {
							pageSize: 25,
							currPage: 1
						}
				};
				getgroupMeetingsList();
			}
		}
		function fetchAuditPage() {
			$scope.groupMeetingsAudit.refresh()
		}
		function isNextAuditPageAvailable() {
			return groupMeetingAuditPageLoader
			&& groupMeetingAuditPageLoader.isNextPageAvailable()
		}
		function fetchMoreAudits() {
			fetchAuditPage();
		}
		function resetAuditPagination() {
			$scope.groupMeetingsAuditList = [];
			groupMeetingAuditPageLoader.resetPagination();
		}
		function getgroupMeetingsList() {
			blockUI.start("Loading...", {
				status: 'isLoading'
			});
			var _params = {
					catId: $stateParams.groupId,
					catType:CATEGORY_TYPE.GROUP,
					pageSize: $scope.GroupMeetingsData.pgInfo.pageSize,
					pageNumber: $scope.GroupMeetingsData.pgInfo.currPage,
					eventType:EVENT_TYPE.TALK
			};
			$scope.groupTabCtrl.groupModel.loadEvents(_params).then(function (res) {
				$scope.loadingNext = false;
				var user = {
						id : $scope.userId
				}
				angular.forEach(res, function (value, key) {
					var index = _.findIndex(value.members, user);
					value.hasAccess = (index > -1) ? true : false;
					
					value.orgId = $stateParams.orgId;
					value.catId = $stateParams.groupId;
					value.catType = CATEGORY_TYPE.GROUP;
					
					$scope.GroupMeetingsData.groupMeetings.push(value);
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
			if ($scope.GroupMeetingsData.groupMeetings.length < totalResults) {
				$scope.isNextPageAvailable = true;
			} else {
				$scope.isNextPageAvailable = false;
			}
		}
		function clickOnMeeting() {
			var params = {
					//orgId : orgId,
					catType : CATEGORY_TYPE.GROUP,
					catId : groupId,
					meetingType:-102
			}
			meetingService.CreateAdhocMeeting(params).then(function (res) {
				if (res.isSuccess) {
//					toggleAudit(false);	
					
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
			formModel.catType = CATEGORY_TYPE.GROUP;
			formModel.catId = groupId;
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
			params.catId = $stateParams.groupId;
			params.catType = CATEGORY_TYPE.GROUP;
			blockUI.start("Loading...");
			meetingService.ownedMeetingsList(params).then(function (res) {
				if (res.resp.length > 0) {
					blockUI.stop();
					meetingService.deleteMeetingDialog(res.resp, params).then(function (res) {
						if (res && res.responseCode == 0) {
							$scope.GroupMeetingsData.groupMeetings = [];
							getgroupMeetingsList();
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
		
		$scope.startAdhocMeeting = function(){
			var deferred = $q.defer();
			
			function _proceedStart(){
				
				var adhocMeetingModel = {};
				adhocMeetingModel.catId = groupId;
				adhocMeetingModel.catType = CATEGORY_TYPE.GROUP;
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

						//$scope.addAllMembersToAdhocMeeting(adhocMeetingModel.catId, adhocMeetingModel.catType).then(function(){
						meetingService.getMeetingInfo({id: adhocMeetingModel.meetingId}).then(function(meetingInfoRes){
							adhocMeetingModel.members = angular.extend([], meetingInfoRes.members);
							adhocMeetingModel.attendees = meetingInfoRes.members;
							adhocMeetingModel.orgId = $stateParams.orgId;
							adhocMeetingModel.groupId = $stateParams.groupId;
							
							$rootScope.$emit(MEETING_VIEW_EVENTS.START_MEETING, {meetingInfo : adhocMeetingModel});
							checkAdhocRoomStatus();
						});

					}else{
						Dialog.alert({
							content: res.responseMessage,
							ok: "Ok"
						});
					} 

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
					blockUI.stop();
					deferred.resolve();
				});

			}
			
			checkAdhocRoomStatus().then(function(){
				if(ROOM_STATUS.AVAILABLE == $scope.roomStatusInfo.roomStatus){
					_proceedStart();
				}else if(ROOM_STATUS.BUSY == $scope.roomStatusInfo.roomStatus && $scope.roomStatusInfo.meeting != null){
					$scope.joinAdhocMeeting();
				}
			});
		
			return deferred.promise;
			
		};
		
		
		$scope.joinAdhocMeeting = function(){
			
			meetingService.getMeetingInfo({id: $scope.roomStatusInfo.meeting.id})
			.then(function (response) {
				_proceedJoin(response);
			});
			
			function _proceedJoin(meetingInfoParam){
				
			var adhocMeetingModel = {};
			adhocMeetingModel.catId = $stateParams.groupId;
			adhocMeetingModel.catType = CATEGORY_TYPE.GROUP;
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
			
//			$scope.addAllMembersToAdhocMeeting(adhocMeetingModel.catId, adhocMeetingModel.catType).then(function(){
				adhocMeetingModel.members = angular.extend([], meetingInfoParam.members);
				adhocMeetingModel.attendees = meetingInfoParam.members;
				adhocMeetingModel.orgId = $stateParams.orgId;
				adhocMeetingModel.groupId = $stateParams.groupId;
				

				var ind = _.findIndex(meetingInfoParam.attendees, {"id":$scope.userId});
				if(ind == -1){
					adhocMeetingModel.members.push(Session.userInfo);
					adhocMeetingModel.attendees.push(Session.userInfo);
					adhocMeetingModel.isNewMember = true;
					adhocMeetingModel.newMemberInfo = Session.userInfo;
				}
				
				$rootScope.$emit(MEETING_VIEW_EVENTS.START_MEETING, {meetingInfo : adhocMeetingModel});
				checkAdhocRoomStatus();
//			});
			}
		};

		$scope.joinMeeting = function(meetingObj){
			var deferred = $q.defer();
			
			meetingObj.catType = CATEGORY_TYPE.GROUP
			meetingObj.catId = groupId;
			
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
		
		$scope.joinUserInConference = function(){

			if(!!meetingId){
				meetingService.getMeetingInfo({id: meetingId})
				.then(function (response) {
					$scope.joinMeeting(response).then(function(){
						State.transitionTo('root.app.group-dashboard.groupMeeting',{orgId : orgId, groupId : groupId}, {reload: true, inherit: false});
						
					});
				})
				.catch(function (error) {

				})
				.finally(function () {

				});
			}
			
			meetingId = null;

		};
		


		function auditClicked() {
			var params = {};
			params.catId = $stateParams.groupId;
			params.catType = CATEGORY_TYPE.GROUP;

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
		
		$scope.startScheduledMeeting = function(meetingObj){
			if ($scope.isMeetingInProgress) {
				Dialog.alert({
					content: "Cannot start meeting. Meeting is in progress in another WorkSpace or Room.",
					ok: "Ok"
				});	
			} else {

				blockUI.start("Loading...");
				
				var obj = {
						catType : CATEGORY_TYPE.GROUP,
						catId : groupId,
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
					meetingObj.attendees = meetingObj.attendees;
					meetingObj.members = angular.extend([], meetingObj.attendees);
					meetingObj.meetingId = res.resp.id;
					
					meetingObj.orgId = $stateParams.orgId;
					meetingObj.groupId = $stateParams.groupId
					
					//$scope.startMeeting(meetingObj);	
					$scope.state.showScheduledMeetings = false;
					$rootScope.$emit(MEETING_VIEW_EVENTS.START_MEETING, {meetingInfo : meetingObj});
				
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
		
		$scope.joinScheduledMeeting = function(meetingObj){
			
			if ($scope.isMeetingInProgress) {
				Dialog.alert({
					content: "Cannot start meeting. Meeting is in progress in another WorkSpace or Room.",
					ok: "Ok"
				});	
			} else {
				blockUI.start("Loading...");

				var obj = {
						catType : CATEGORY_TYPE.GROUP,
						catId : groupId,
						meetingId:meetingObj.meetingId,
				}

				meetingService.toJoinMeeting(obj).then(function (res) {
					meetingObj.roomName = res.roomName;
					meetingObj.roomPassword = res.roomPassword;
//					meetingObj.catType = CATEGORY_TYPE.ORG;
//					meetingObj.catId = orgId;
					meetingObj.owner = meetingObj.owner;
					meetingObj.attendees = meetingObj.attendees;
					meetingObj.members = angular.extend([], meetingObj.attendees);
					meetingObj.isModerator = ($scope.userId == meetingObj.owner.id) ? true : false;
					$scope.state.showScheduledMeetings = false;
					
					meetingObj.orgId = $stateParams.orgId;
					meetingObj.groupId = $stateParams.groupId;
					
					
					$rootScope.$emit(MEETING_VIEW_EVENTS.START_MEETING, {meetingInfo : meetingObj});
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

		function prepareMeetingEndTime(startTime, hrs, mins) {
			var d = new Date(startTime);
			d.setHours(d.getHours() + hrs);
			d.setMinutes(d.getMinutes() + mins);
			return d.getTime();
		}
		
		
//		!!meetingId && $scope.joinUserInConference();
		$rootScope.$on(MEETING_VIEW_EVENTS.END_MEETING, function(event, args){
			checkAdhocRoomStatus();
		});
	}
})();
