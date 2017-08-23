/**
 * Created by sandeep on 24/11/16.
 */
;
(function() {
	"use strict";
	angular.module('app')
	.filter('meetingStatus', function() {
	  })
	.controller('TaskMeetingViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog', '$timeout', 
	                                         'Lang', 'Session','$controller','meetingService','TaskService',
	                                         'MEETING_TYPES', 'CATEGORY_TYPE','$mdToast', 'CONFERENCE_BROADCAST',
	                                         'URL','$q','State',TaskMeetingViewController])
	                                         
	function TaskMeetingViewController($scope, $stateParams, blockUI, DataProvider, Dialog, $timeout,
			                          Lang, Session, $controller, meetingService, TaskService,
			                          MEETING_TYPES, CATEGORY_TYPE, $mdToast, CONFERENCE_BROADCAST, 
			                          URL, $q, State) {
		var LANG = Lang.en.data
		, jobId = $stateParams.jobId
		, taskId = $stateParams.taskId
		, _rawResponse
		, taskMeetingAuditPageLoader
		, taskMeetingAuditLoader
		, taskMeetingCollection = []
		, meetingId = $stateParams.meetingId
		;
		console.log("In TASK TaskMeetingViewController controller");
		$scope.userId = Session.userId;
		
		function _init() {
			angular.extend(self, $controller('ViewDataBaseController', {
				$scope: $scope
			}));
			$scope.xtras.selectedTabIndex = 3;
			$scope.isNextPageAvailable = false;
			$scope.loadingNext = false;
			$scope.TaskMeetingsData = {
					taskMeetings: [],
					pgInfo: {
						pageSize: 25,
						currPage: 1
					}
			};
			$scope.taskMeetingsAuditList = [];
			$scope.taskTabCtrl.taskModel = DataProvider.resource.Task.get(taskId);
			/**
			 * task meetings audits
			 */
			taskMeetingAuditPageLoader = TaskService.createTalkVaultAuditListLoader(taskId, taskMeetingCollection);
			taskMeetingAuditLoader = self.initializeViewDataBaseController('taskMeetingsAudit',
					function () {
				return taskMeetingAuditPageLoader.fn()
				.then(function (audits) {
					"use strict";
					$scope.taskMeetingsAuditList = _.uniq($scope.taskMeetingsAuditList.concat(audits));
					return $scope.taskMeetingsAuditList;
				});
			});
			$scope.ui.auditActivityStore = taskMeetingAuditPageLoader.getActivityStore(); 
			$scope.loadNext = loadNext;
			$scope.toggleAudit = toggleAudit;
			$scope.isNextAuditPageAvailable = isNextAuditPageAvailable;
			$scope.fetchMoreAudits = fetchMoreAudits;
			$scope.toggleMeetingMembers = toggleMeetingMembers;
			$scope.meetingStatus = meetingService.meetingStatus;
			$scope.editMeeting = editMeeting;
			$scope.isMeetingInProgress = false; 
			$scope.meetingInfo = {};
			$scope.isModerator = false;
			$scope.participantsList = [ ];
			$scope.participant_KV = {};
			$scope.isUserMuted = false;
			$scope.state = {
					showAudit: false
			};
		}
		_init();
		if ($scope.taskTabCtrl.taskModel) {
			initTaskMeetingsView();
		} else {
			$scope.fetchTaskModelAndJobModel().then(function () {
				initTaskMeetingsView();
			});
		}
		function initTaskMeetingsView() {
			getMeetingTabMenuList();
			gettaskMeetingsList();
		}
		function getMeetingTabMenuList() {
			$scope.taskTabCtrl.optionMenuItems.TAB_TALK = [];
			var chatTabMenuItems = [{
				name: "Start Meeting",
				action: clickOnMeeting,
				isAllowed: true
			}];
			
			/* {
				name: "Delete Meeting",
				action: deleteTaskMeeting,
				isAllowed: true
			} */
			
			angular.forEach(chatTabMenuItems, function(menuItem) {
				if (menuItem.isAllowed) {
					$scope.taskTabCtrl.optionMenuItems.TAB_TALK.push(menuItem);
				}
			});
		}
		function loadNext() {
			$scope.loadingNext = true;
			$scope.TaskMeetingsData.pgInfo.currPage += 1;
			gettaskMeetingsList();
		}
		function toggleAudit(enable) {
			$scope.state.showAudit = !!enable;
			if ($scope.state.showAudit) {
				resetAuditPagination();
				fetchAuditPage();
			} else {
				$scope.TaskMeetingsData = {
						taskMeetings: [],
						pgInfo: {
							pageSize: 25,
							currPage: 1
						}
				};
				gettaskMeetingsList();
			}
		}
		function fetchAuditPage() {
			$scope.taskMeetingsAudit.refresh()
		}
		function isNextAuditPageAvailable() {
			return taskMeetingAuditPageLoader
			&& taskMeetingAuditPageLoader.isNextPageAvailable()
		}
		function fetchMoreAudits() {
			fetchAuditPage();
		}
		function resetAuditPagination() {
			$scope.taskMeetingsAuditList = [];
			taskMeetingAuditPageLoader.resetPagination();
		}
		function gettaskMeetingsList() {
			blockUI.start("Loading...", {
				status: 'isLoading'
			});
			var _params = {
					catId: $stateParams.taskId,
					catType:CATEGORY_TYPE.TASK,
					pageSize: $scope.TaskMeetingsData.pgInfo.pageSize,
					pageNumber: $scope.TaskMeetingsData.pgInfo.currPage,
			};
			$scope.taskTabCtrl.taskModel.loadMeetings(_params).then(function (res) {
				$scope.loadingNext = false;
				var user = {
						id : $scope.userId
				}
				angular.forEach(res, function (value, key) {
					var index = _.findIndex(value.members, user);
					value.hasAccess = (index > -1) ? true : false;
					
					$scope.TaskMeetingsData.taskMeetings.push(value);
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
			if ($scope.TaskMeetingsData.taskMeetings.length < totalResults) {
				$scope.isNextPageAvailable = true;
			} else {
				$scope.isNextPageAvailable = false;
			}
		}
		function clickOnMeeting() {
			var params = {
					catType : CATEGORY_TYPE.TASK,
					catId : taskId,
					meetingType:MEETING_TYPES.ADHOC
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
			formModel.catType = CATEGORY_TYPE.TASK;
			formModel.catId = taskId;
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
		function deleteTaskMeeting() {
			var params = {};
			params.catId = $stateParams.taskId;
			params.catType = CATEGORY_TYPE.TASK;
			blockUI.start("Loading...");
			meetingService.ownedMeetingsList(params).then(function (res) {
				if (res.resp.length > 0) {
					blockUI.stop();
					meetingService.deleteMeetingDialog(res.resp, params).then(function (res) {
						if (res && res.responseCode == 0) {
							$scope.TaskMeetingsData.taskMeetings = [];
							gettaskMeetingsList();
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
		
		
		$scope.joinMeeting = function(meetingObj){
			var deferred = $q.defer();
			
			meetingObj.catId = taskId;
			meetingObj.catType = CATEGORY_TYPE.TASK;
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
						State.transitionTo('root.app.task-dashboard.taskTalk',{jobId : jobId, taskId : taskId}, {reload: true, inherit: false});
					});
				})
				.catch(function (error) {

				})
				.finally(function () {

				});
			}
			
			meetingId = null;

		};
		
		!!meetingId && $scope.joinUserInConference();
		
	}
})();