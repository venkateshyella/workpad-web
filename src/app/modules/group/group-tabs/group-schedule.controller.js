/**
 * Created by sandeep on 19/8/16.
 */
(function () {
	"use strict";

	angular.module('app')
	.controller('GroupScheduleViewController',
			[
			 '$scope', '$stateParams','Session','Connect','URL','CATEGORY_TYPE','EVENTS',
			 'DataProvider','mDialog', 'GroupService','EventService','blockUI','$controller','$timeout','EVENTS_REPEAT_FTYPES','EVENTS_REPEAT_TYPES',
			 'Lang','$mdToast','AuditService','EVENT_TYPE', GroupScheduleViewController])
			 ;

	function GroupScheduleViewController($scope, $stateParams,Session,Connect,URL,CATEGORY_TYPE,EVENTS
	, DataProvider,Dialog, GroupService, EventService,blockUI,$controller,$timeout,EVENTS_REPEAT_FTYPES,EVENTS_REPEAT_TYPES,Lang,$mdToast, AuditService,EVENT_TYPE) {
		
		
		var self = this
		, LANG = Lang.en.data
		, _rawResponse
		, groupId = $stateParams.groupId
		, orgId = $stateParams.orgId
		, groupEventAuditLoader
		, groupEventAuditPageLoader
		, groupEventsCollection = []
		;
		
		_init();

		function _init() {
			angular.extend(self, $controller('ViewDataBaseController', {
				$scope: $scope
			}));
			
			$scope.xtras.selectedTabIndex = 7;

			$scope.state = {
					showAudit: false
			};

			$scope.groupEventsData = {
				groupEvents: [],
				pgInfo: {
					pageSize: 25,
					currPage: 1
				}
			};
			
			$scope.ui = {
					isRefreshing: false,
					isLoadingNext: false,
					isAuditSelected: false
				};
			
			$scope.eventRepeatFTypes = EVENTS_REPEAT_FTYPES;
			$scope.eventRepeatTypes = EVENTS_REPEAT_TYPES;
			
			$scope.groupTabCtrl.groupModel = DataProvider.resource.Group.get(groupId);

			$scope.isNextPageAvailable = false;
			$scope.loadingNext = false;
/*
			{
	         	   "type": "all",
	         	   "label":"All"
	            },
	            */
			
			$scope.filters = [
            {
         	   "type": "day",
         	   "label":"Today"
         		   
            },
            {
         	   "type": "week",
         	   "label":"Week"
            },
            {
         	   "type": "month",
         	   "label":"Month"
         	   
            },{
         	   "type": "all",
        	   "label":"All"
        	   
           }]

			/**
			 * Group Data Audit
			 * */
			$scope.groupEventsAuditList = [];
			groupEventAuditPageLoader = GroupService.createGroupEventAuditListLoader(groupId, groupEventsCollection);
			groupEventAuditLoader = self.initializeViewDataBaseController('groupEventsAudit',
				function () {
					return groupEventAuditPageLoader.fn()
						.then(function (audits) {
							"use strict";
							$scope.groupEventsAuditList = _.uniq($scope.groupEventsAuditList.concat(audits));
							return $scope.groupEventsAuditList;
						});
				});
			
			$scope.ui.auditActivityStore = groupEventAuditPageLoader.getActivityStore(); 

			$scope.eventItemClickAction = eventItemClickAction;
			$scope.loadNext = loadNext;
			$scope.toggleAudit = toggleAudit;
			$scope.toggleEventMembers = toggleEventMembers;
			$scope.loadGroupEventsClick = loadGroupEventsClick;
			$scope.isNextAuditPageAvailable = isNextAuditPageAvailable;
			$scope.fetchMoreAudits = fetchMoreAudits;
			$scope.selected = 0; 
			$scope.fStartTime = new Date().getTime();
			$scope.fEndTime = $scope.MU.getEventEndDate($scope.filters[0].type);
		}
		
		$scope.selectFilter= function(index, type) {
			$scope.selected = index;
			loadGroupEventsClick(type);
		};

		$scope.getGroupModelAndOrgModel().then(function() {
			initGroupEventsView();
		});

		function initGroupEventsView() {
			getEventsTabMenuList();
			getGroupEventsList();
		}

		function getGroupEventsList() {
			$scope.eventGrpOwner = EVENTS.EVENT_OWNER;

			if ($scope.groupEventsData.groupEvents.length == 0) {

				blockUI.start("Loading Room Events..", {
					status: 'isLoading'
				});
			}
			
			var _params = {
				catId: groupId,
				pageSize: $scope.groupEventsData.pgInfo.pageSize,
				pageNumber: $scope.groupEventsData.pgInfo.currPage,
				fStartTime:$scope.fStartTime,
				fEndTime:$scope.fEndTime
			};
			
			$scope.groupTabCtrl.groupModel.loadEvents(_params).then(function (res) {
				$scope.loadingNext = false;
				angular.forEach(res, function (value, key) {
					if(value.eventType.code == EVENT_TYPE.SCHEDULE_JOB){
						if(value.scheduledJob.templateId != null){
						var invitees = [];
						var invitations = value.scheduledJob.invitations;
						for(var i=0; i < invitations.length; i++){
							for(var j=0; j < invitations[i].invitees.length; j++){
								invitations[i].invitees[j].invitationPath = invitations[i].invitationPath;
								invitees.push(invitations[i].invitees[j]);
							}
						}
					}else if((value.scheduledJob.templateId == null) && (!value.scheduledJob.owner)){
						var invitees = [];
						var invitations = value.scheduledJob.invitations;
						for(var i=0; i < invitations.length; i++){
							for(var j=0; j < invitations[i].invitees.length; j++){
								invitations[i].invitees[j].invitationPath = invitations[i].invitationPath;
								invitees.push(invitations[i].invitees[j]);
							}
						}
					}else {
						var invitees = [];
						invitees.push(Session.userInfo);
					}
					}
					value.allInvitees = invitees;
					$scope.groupEventsData.groupEvents.push(value);
					
					/*$scope.OrgEventsData.orgEvents = _.uniq($scope.OrgEventsData.orgEvents, function (job, key, id) {
						return job.id;
					});*/
					
				});

				$timeout();
				checkNextPgAvailability();
			}, null, function (rawResponse) {
				_rawResponse = rawResponse;
			}).catch(function (error) {
				console.log(error);
			}).finally(function () {
				blockUI.stop();
			});

		}

		function loadGroupEventsClick(type){
			$scope.fEndTime = $scope.MU.getEventEndDate(type);

			$scope.groupEventsData = {
					groupEvents: [],
					pgInfo: {
						pageSize: 25,
						currPage: 1
					}
			};

			if (type == $scope.filters[0].type) {
				$scope.fStartTime = new Date().getTime();
			} else {
				$scope.fStartTime = new Date().getTime();
			}

			getGroupEventsList();
		}

        function getGroupDetails(groupId) {

            return DataProvider.resource.Group.find(groupId, {
                bypassCache: true,
                groupId: groupId
            });

        }
		
		function getEventsTabMenuList() {

			$scope.groupTabCtrl.optionMenuItems.TAB_GROUP_EVENTS = [];

			var eventsTabMenuItems = [{
				name: "Add Event",
				action: addEventClicked,
				isAllowed: !$scope.isVisitor
			}
			,{
				name: "Delete Event",
				action: deleteEventClicked,
				isAllowed: !$scope.isVisitor
			},{
				name: "Audit",
				action: auditClicked,
				isAllowed: true
			}];

			angular.forEach(eventsTabMenuItems, function (menuItem) {
				if (menuItem.isAllowed) {
					$scope.groupTabCtrl.optionMenuItems.TAB_GROUP_EVENTS.push(menuItem);
				}
			});
		}

		function addEventClicked() {
			var group = $scope.groupTabCtrl.groupModel
		    , options = options || {}
		    , bundle = {};

        if (!group) {
            getOrgDetails(groupId).then(function(group) {
            	group = group;
            });
        }
        
        options.autoClose = false;
        bundle.obj = group;
        bundle.orgId = orgId;
        bundle.id = groupId;
        bundle.catId = groupId;
        bundle.catType = CATEGORY_TYPE.GROUP;
        
        
		EventService.createEventDialog(bundle,options).then(function (res) {
			if (res.isSuccess == true) {

				$scope.groupEventsData = {
					groupEvents: [],
					pgInfo: {
						pageSize: 25,
						currPage: 1
					}
				};
				$scope.selected = 0; 
				$scope.fStartTime = new Date().getTime();
				$scope.fEndTime = $scope.MU.getEventEndDate($scope.filters[0].type);
				getGroupEventsList();
			}
		})
		.catch(function (err) {
			
		})
		.finally(function () {
		});
	}

		$scope.editGroupEvent = function(groupEvent) {
			var group = $scope.groupTabCtrl.groupModel
			, options = options || {}
			, bundle = {};

			if (!group) {
				getOrgDetails(groupId).then(function(group) {
					group = group;
				});
			}

			options.autoClose = false;
			bundle.obj = group;
			bundle.id = groupId;
			bundle.catId = groupId;
			bundle.catType = CATEGORY_TYPE.GROUP;
			bundle.orgId = orgId;


			bundle.eventEntity = groupEvent;
			bundle.isEdit = true;

			EventService.createEventDialog(bundle,options).then(function (res) {
				if (res.isSuccess) {
					$scope.groupEventsData.groupEvents=[];
					getGroupEventsList();
				}
			});
		}


		function deleteEventClicked() {
			var params = {};
			params.catId = $stateParams.groupId;
			params.catType = CATEGORY_TYPE.GROUP;
			
			blockUI.start("Fetching Events");

			EventService.ownedEventsList(params).then(function (res) {
				if (res.length > 0) {
					blockUI.stop();
					EventService.deleteEventDialog(res, params).then(function (res) {
						if (res && res.responseCode == 0) {
							$scope.groupEventsData.groupEvents = [];
							$scope.selected = 0; 
							$scope.fStartTime = new Date().getTime();
							$scope.fEndTime = $scope.MU.getEventEndDate($scope.filters[0].type);
							getGroupEventsList();
							var toast = $mdToast.simple()
							.content("Event Deleted successfully")
							.position('bottom right')
							.hideDelay(3000);
							$mdToast.show(toast)
							.then(function (res) {
							});
						}
					}).catch(function (err) {
							Dialog.alert({
								content: err.message,
								ok: "Ok"
							});
					});
				} else{
					blockUI.stop("No Events available", {
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
		
		function toggleAudit(enable) {
			$scope.state.showAudit = !!enable;
			if ($scope.state.showAudit) {
				resetAuditPagination();
				fetchAuditPage()
			} else {

			}
		}
		
		function checkNextPgAvailability() {
			var totalResults = _rawResponse.resp.paginationMetaData.totalResults;
			if ($scope.groupEventsData.groupEvents.length < totalResults) {
				$scope.isNextPageAvailable = true;
			} else {
				$scope.isNextPageAvailable = false;
			}
		}
		
		$scope.viewMembersFlagMeta = {};
		function toggleEventMembers(event) {
			$scope.viewMembersFlagMeta[event] = !$scope.viewMembersFlagMeta[event];

		}

		function loadNext() {
			$scope.loadingNext = true;
			$scope.groupEventsData.pgInfo.currPage += 1;
			getGroupEventsList();
		}

		function eventItemClickAction($event, job) {


			/*var role = job.roles;

			if (job && job.id) {
				if (job.roles.length > 0) {
					$scope.transitionTo('root.app.job-view.jobProfile', {
						jobId: job.id
					}, {REPLACE_STATE: false});
				} else {
					Dialog.alert({
						content: LANG.JOB.LABEL.JOB_ACCESS_RESTRICTED,
						ok: LANG.BUTTON.OK
					});
				}
			}*/

		}

		function resetAuditPagination() {
			$scope.groupEventsAuditList = [];
			groupEventAuditPageLoader.resetPagination();
		}
		
		function isNextAuditPageAvailable() {
			return groupEventAuditPageLoader
				&& groupEventAuditPageLoader.isNextPageAvailable()
		}
		
		function fetchMoreAudits() {
			fetchAuditPage();
		}
		
		$scope.deleteGroupEvent = function(groupEvent) {
			
				
				EventService.deleteEventDialog(groupEvent,$scope.groupTabCtrl.groupModel.id,CATEGORY_TYPE.GROUP).
				then(function () {
					$scope.groupEventsData.groupEvents=[];
					getGroupEventsList();
				})
				.catch(function () {
					
				});
				
				
				
		}
		
		function fetchAuditPage() {
			$scope.groupEventsAudit.refresh()
		}
		
        function auditClicked() {
			var params = {};
			params.catId = $stateParams.groupId;
			params.catType = CATEGORY_TYPE.GROUP;

			blockUI.start("Fetching Audit data");
			AuditService.checkAuditList(URL.ORG_EVENTS_AUDIT,params).then(function (res) {
				if (res.results.length > 0) {
					var title = "Schedule";
					blockUI.stop();
					AuditService.showAudit(URL.ORG_EVENTS_AUDIT,params,title, res).then(function (res) {

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
        

	}
	})();