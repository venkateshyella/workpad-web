;
(function() {
	"use strict";

	angular.module('app')
	.controller('JobMeetingViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog', '$timeout',
	                                         'Lang', 'Session','$controller','meetingService','JobService',
	                                         'CATEGORY_TYPE','$mdToast','$q','State','AuditService', 'URL',
	                                         '$rootScope','MEETING_MESSAGES','MEETING_VIEW_EVENTS',
	                                         'EVENT_TYPE','ROOM_STATUS', 'MEETING_TYPES', JobMeetingViewController])

	function JobMeetingViewController($scope, $stateParams, blockUI, DataProvider, Dialog, $timeout,
			                           Lang, Session, $controller, meetingService, JobService, 
			                           CATEGORY_TYPE, $mdToast, $q, State, AuditService, URL,
			                           $rootScope, MEETING_MESSAGES, MEETING_VIEW_EVENTS,
                                       EVENT_TYPE, ROOM_STATUS, MEETING_TYPES) {

		var LANG = Lang.en.data
		, jobId = $stateParams.jobId
		, _rawResponse
		, jobMeetingAuditPageLoader
		, jobMeetingAuditLoader
		, jobMeetingCollection = []
		, orgId
		, meetingId = $stateParams.meetingId
		, adhocMeetingDefaultEndTime = 30
		;
		
		$scope.userId = Session.userId;
		console.log("In Job Meeting controller");
		
		function _init() {
			angular.extend(self, $controller('ViewDataBaseController', {
				$scope: $scope
			}));
			$scope.xtras.selectedTabIndex = 3;
			$scope.isNextPageAvailable = false;
			$scope.loadingNext = false;
			$scope.Data = {
					jobMeetings: [],
					pgInfo: {
						pageSize: 25,
						currPage: 1
					}
			};
			$scope.jobMeetingsAuditList = [];
			$scope.JobTabCtrl.jobModel = DataProvider.resource.Job.get(jobId);
			orgId = $scope.JobTabCtrl.jobModel.orgId;
			
			/**
			 * job meetings audits
			 */
			jobMeetingAuditPageLoader = JobService.createJobMeetingAuditListLoader(jobId, jobMeetingCollection);
			jobMeetingAuditLoader = self.initializeViewDataBaseController('jobMeetingsAudit',
					function () {
				return jobMeetingAuditPageLoader.fn()
				.then(function (audits) {
					"use strict";
					$scope.jobMeetingsAuditList = _.uniq($scope.jobMeetingsAuditList.concat(audits));
					return $scope.jobMeetingsAuditList;
				});
			});
			$scope.ui.auditActivityStore = jobMeetingAuditPageLoader.getActivityStore(); 
			$scope.loadNext = loadNext;
			$scope.toggleAudit = toggleAudit;
			$scope.isNextAuditPageAvailable = isNextAuditPageAvailable;
			$scope.fetchMoreAudits = fetchMoreAudits;
			$scope.toggleMeetingMembers = toggleMeetingMembers;
			$scope.meetingStatus = meetingService.meetingStatus;
			$scope.editMeeting = editMeeting;
			meetingId = $stateParams.meetingId;
			
			$scope.toggleMeetings = toggleMeetings;
			
			$scope.roomStatusInfo = null;
			$scope.ROOM_STATUS = ROOM_STATUS;
			$scope.adhocMembers = [];
			
			$scope.talkMeetingTypes = MEETING_TYPES;
			
			if($scope.meetingInfo && $scope.meetingInfo.catId ){
				var show = true;
				if(jobId != $scope.meetingInfo.catId){
					show = false;
				}
				$rootScope.$emit(MEETING_VIEW_EVENTS.SHOW_MEETING_OPTIONS, {isShown : show});
			}
			
			$scope.pollOptions = {
					endPointParams: { orgId: orgId,
		  			      catId: jobId,
					      catType: CATEGORY_TYPE.JOB
					    },
					endPointUrl: URL.ROOM_STATUS
			};
		}
		
		_init();
		if ($scope.JobTabCtrl.jobModel) {
			initJobMeetingsView();
		} else {
			$scope.fetchJobDetails().then(function () {
				initJobMeetingsView();
			});
		}
		function initJobMeetingsView() {
			$scope.JobTabCtrl.tab_curr = 'TAB_TALK';
			getMeetingTabMenuList();
			//getJobMeetingsList();
			checkAdhocRoomStatus();
		}
		function getMeetingTabMenuList() {
			$scope.JobTabCtrl.optionMenuItems.TAB_TALK = [];
			var chatTabMenuItems = [{
				name: "Audit",
				action: auditClicked,
				isAllowed: true
			}
			];
			
			$scope.state = {
					showAudit: false,
					showScheduledMeetings: false
			};
			angular.forEach(chatTabMenuItems, function(menuItem) {
				if (menuItem.isAllowed) {
					$scope.JobTabCtrl.optionMenuItems.TAB_TALK.push(menuItem);
				}
			});
		}
		function loadNext() {
			$scope.loadingNext = true;
			$scope.Data.pgInfo.currPage += 1;
			getJobMeetingsList();
		}
		function toggleAudit(enable) {
			$scope.state.showAudit = !!enable;
			if ($scope.state.showAudit) {
				resetAuditPagination();
				fetchAuditPage();
			} else {
				$scope.Data = {
						jobMeetings: [],
						pgInfo: {
							pageSize: 25,
							currPage: 1
						}
				};
				getJobMeetingsList();
			}
		}
		
		function auditClicked() {
			var params = {};
			params.catId = jobId;
			params.catType = CATEGORY_TYPE.JOB;

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
		
		
		function toggleMeetings(enable) {
			$scope.state.showScheduledMeetings = !!enable;
			if ($scope.state.showScheduledMeetings) {
				$scope.Data = {
						jobMeetings: [],
						pgInfo: {
							pageSize: 25,
							currPage: 1
						}
				};
				getJobMeetingsList();
			}else{
				checkAdhocRoomStatus();
			} 
		}
		
		function checkAdhocRoomStatus() {
			var deferred = $q.defer();
			$scope.roomStatusInfo = null;
			blockUI.start("Loading...", {
				status: 'isLoading'
			});
			
			
			var params = { orgId: orgId,
  			      catId: jobId,
			      catType: CATEGORY_TYPE.JOB
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
			$scope.jobMeetingsAudit.refresh()
		}
		function isNextAuditPageAvailable() {
			return jobMeetingAuditPageLoader
			&& jobMeetingAuditPageLoader.isNextPageAvailable()
		}
		function fetchMoreAudits() {
			fetchAuditPage();
		}
		function resetAuditPagination() {
			$scope.jobMeetingsAuditList = [];
			jobMeetingAuditPageLoader.resetPagination();
		}
		function getJobMeetingsList() {
			blockUI.start("Loading...", {
				status: 'isLoading'
			});
			var _params = {
					catId: $stateParams.jobId,
					catType:CATEGORY_TYPE.JOB,
					pageSize: $scope.Data.pgInfo.pageSize,
					pageNumber: $scope.Data.pgInfo.currPage,
					eventType:EVENT_TYPE.TALK
			};
			
			var user = {
					id : $scope.userId
			}
			
			$scope.JobTabCtrl.jobModel.loadMeetings(_params).then(function (res) {
				$scope.loadingNext = false;
				angular.forEach(res, function (value, key) {
					var index = _.findIndex(value.members, user);
					value.hasAccess = (index > -1) ? true : false;

					$scope.Data.jobMeetings.push(value);
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
			if ($scope.Data.jobMeetings.length < totalResults) {
				$scope.isNextPageAvailable = true;
			} else {
				$scope.isNextPageAvailable = false;
			}
		}
		function clickOnMeeting() {
			var params = {
					//orgId : orgId,
					catType : CATEGORY_TYPE.JOB,
					catId : jobId,
					meetingType:-102
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
			formModel.catType = CATEGORY_TYPE.JOB;
			formModel.catId = jobId;
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
			params.catId = $stateParams.jobId;
			params.catType = CATEGORY_TYPE.JOB;
			blockUI.start("Loading...");
			meetingService.ownedMeetingsList(params).then(function (res) {
				if (res.resp.length > 0) {
					blockUI.stop();
					meetingService.deleteMeetingDialog(res.resp, params).then(function (res) {
						if (res && res.responseCode == 0) {
							$scope.Data.jobMeetings = [];
							getJobMeetingsList();
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
			
			meetingObj.catType = CATEGORY_TYPE.JOB
			meetingObj.catId = jobId;
			
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
		

		$scope.startAdhocMeeting = function(){
			
			if(checkOtherMeetingInProgress()){
				return;
			}
			
			var deferred = $q.defer();
			
			function _proceedStart(){
				
				var adhocMeetingModel = {};
				adhocMeetingModel.catId = jobId;
				adhocMeetingModel.catType = CATEGORY_TYPE.JOB;
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
						  							
						meetingService.getMeetingInfo({id: adhocMeetingModel.meetingId}).then(function(meetingInfoRes){
							adhocMeetingModel.members = angular.extend([], meetingInfoRes.members);
							adhocMeetingModel.attendees = meetingInfoRes.members;
							adhocMeetingModel.orgId = orgId;
							adhocMeetingModel.groupId = null;
							adhocMeetingModel.jobId = jobId;
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
					Dialog.alert({
						content: err.respMsg,
						ok: "Ok"
					});
				
			}).catch(function (err) {
				blockUI.stop();
				Dialog.alert({
					content: err.respMsg,
					ok: "Ok"
				});
			});
			
			function _proceedJoin(meetingInfoParam){

				var adhocMeetingModel = {};
				adhocMeetingModel.catId = jobId;
				adhocMeetingModel.catType = CATEGORY_TYPE.JOB;
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

				adhocMeetingModel.members = angular.extend([], meetingInfoParam.members);
				adhocMeetingModel.attendees = meetingInfoParam.members;
				adhocMeetingModel.orgId = orgId;
				adhocMeetingModel.groupId = null;
				adhocMeetingModel.jobId = jobId;

				var ind = _.findIndex(meetingInfoParam.attendees, {"id":$scope.userId});
				if(ind == -1){
					adhocMeetingModel.members.push(Session.userInfo);
					adhocMeetingModel.attendees.push(Session.userInfo);
					adhocMeetingModel.isNewMember = true;
					adhocMeetingModel.newMemberInfo = Session.userInfo;
				}

				$rootScope.$emit(MEETING_VIEW_EVENTS.START_MEETING, {meetingInfo : adhocMeetingModel});
				checkAdhocRoomStatus();
			}
		};
		
		function prepareMeetingEndTime(startTime, hrs, mins) {
			var d = new Date(startTime);
			d.setHours(d.getHours() + hrs);
			d.setMinutes(d.getMinutes() + mins);
			return d.getTime();
		}
		
		$scope.startScheduledMeeting = function(meetingObj){
			blockUI.start("Loading...");
			
			var obj = {
					catType : CATEGORY_TYPE.JOB,
					catId : jobId,
					meetingType:MEETING_TYPES.SCHEDULED,
					eventId:meetingObj.id,
					startTime:meetingObj.startTime,
					endTime:meetingObj.endTime
					}
			
			meetingService.createMeeting(obj).then(function (res) {
				meetingObj.roomName = res.resp.roomName;
				meetingObj.roomPassword = res.resp.roomPassword;
				meetingObj.isModerator = ($scope.userId == meetingObj.owner.id) ? true : false;
				meetingObj.owner = meetingObj.owner;
				meetingObj.attendess = meetingObj.attendees;
				meetingObj.meetingId = res.resp.id;
				
				meetingObj.orgId = $stateParams.orgId;
				meetingObj.groupId = null;
				meetingObj.jobId = jobId;
				
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
		};
		
		
		$scope.joinScheduledMeeting = function(meetingObj){
			blockUI.start("Loading...");
			
			
			var obj = {
					catType : CATEGORY_TYPE.JOB,
					catId : jobId,
					meetingId:meetingObj.meetingId,
			}

			meetingService.toJoinMeeting(obj).then(function (res) {
				meetingObj.roomName = res.roomName;
				meetingObj.roomPassword = res.roomPassword;
				meetingObj.owner = meetingObj.owner;
				meetingObj.attendess = meetingObj.attendees;
				meetingObj.isModerator = ($scope.userId == meetingObj.owner.id) ? true : false;
				$scope.state.showScheduledMeetings = false;
				meetingObj.orgId = orgId;
				meetingObj.groupId = null;
				meetingObj.jobId = jobId;
				
				
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
		};
		
		$rootScope.$on(MEETING_VIEW_EVENTS.END_MEETING, function(event, args){
			checkAdhocRoomStatus();
		});
	}
})();
