/**
 * Created by vikas on 22-Aug-2016
 */
;
(function () {
	"use strict";

	angular.module('app')
		.controller('OrgScheduleViewController', [
			'$scope', '$stateParams', 'blockUI',
			'DataProvider', 'mDialog', '$timeout', '$controller','Connect','URL',
			'Lang', 'Session',
			'EventService', 'OrganisationService','EVENTS_REPEAT_FTYPES',
			'EVENTS_REPEAT_TYPES','CATEGORY_TYPE', 'EVENTS','$mdToast','AuditService','EVENT_TYPE', OrgScheduleViewController])
	;

	function OrgScheduleViewController($scope, $stateParams, blockUI
		, DataProvider, Dialog, $timeout, $controller, Connect, URL
		, Lang, Session, EventService, OrganisationService,EVENTS_REPEAT_FTYPES
		,EVENTS_REPEAT_TYPES, CATEGORY_TYPE, EVENTS, $mdToast, AuditService,EVENT_TYPE) {
		
		var self = this
			, LANG = Lang.en.data
			, orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId
			, _rawResponse
			, orgEventsAuditPageLoader
			, orgEventsAuditLoader
			, orgEventsCollection = []
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

			$scope.OrgEventsData = {
				orgEvents: [],
				pgInfo: {
					pageSize: 25,
					currPage: 1
				}
			};
			
/*			{
         	   "type": "all",
         	   "label":"All"
            },
*/			
			$scope.filters = [{
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
			
			$scope.ui = {
					isRefreshing: false,
					isLoadingNext: false,
					isAuditSelected: false
				};
			
			$scope.eventRepeatFTypes = EVENTS_REPEAT_FTYPES;
			$scope.eventRepeatTypes = EVENTS_REPEAT_TYPES;
			
			$scope.orgEventsAuditList = [];
			$scope.orgTabCtrl.orgModel = DataProvider.resource.Organisation.get(orgId);

			$scope.isNextPageAvailable = false;
			$scope.loadingNext = false;

			/**
			 * org events audits
			 */
			orgEventsAuditPageLoader = OrganisationService.createOrgEventAuditListLoader(orgId, orgEventsCollection);
			orgEventsAuditLoader = self.initializeViewDataBaseController('orgEventsAudit',
				function () {
					return orgEventsAuditPageLoader.fn()
						.then(function (audits) {
							"use strict";
							$scope.orgEventsAuditList = _.uniq($scope.orgEventsAuditList.concat(audits));
							return $scope.orgEventsAuditList;
						});
				});
			$scope.ui.auditActivityStore = orgEventsAuditPageLoader.getActivityStore(); 
			
			$scope.eventItemClickAction = eventItemClickAction;
			$scope.loadNext = loadNext;
			$scope.toggleAudit = toggleAudit;
			$scope.toggleEventMembers = toggleEventMembers;
			$scope.loadOrgEventsClick = loadOrgEventsClick;
			$scope.isNextAuditPageAvailable = isNextAuditPageAvailable;
			$scope.fetchMoreAudits = fetchMoreAudits;
			$scope.selected = 0; 
			$scope.fStartTime = new Date().getTime()
			$scope.fEndTime = $scope.MU.getEventEndDate($scope.filters[0].type);
		}

		$scope.selectFilter= function(index, type) {
			$scope.selected = index;
			loadOrgEventsClick(type);
		};

		if ($scope.orgTabCtrl.orgModel) {
			initOrgEventsView();
		} else {
			$scope.getOrgDetails().then(function () {
				initOrgEventsView();
			});
		}

		function initOrgEventsView() {
			getOrgEvents();
			getEventsTabMenuList();
		}

		function getEventsTabMenuList() {

			$scope.orgTabCtrl.optionMenuItems.TAB_SCHEDULE = [];

			var eventTabMenuItems = [{
				name: "Add Event",
				action: createThenEditEvent,
				isAllowed: true
			},
			{
				name: "Delete Event",
				action: deleteOrgEvent,
				isAllowed: true
			},{
				name: "Audit",
				action: auditClicked,
				isAllowed: true
			}];

			angular.forEach(eventTabMenuItems, function (menuItem) {
				if (menuItem.isAllowed) {
					$scope.orgTabCtrl.optionMenuItems.TAB_SCHEDULE.push(menuItem);
				}
			});
		}

		function createThenEditEvent() {
			var org = DataProvider.resource.Organisation.get($stateParams.orgId)
			    , options = options || {}
			    , bundle = {};

            if (!org) {
                getOrgDetails($stateParams.orgId).then(function(org) {
                    org = org;
                });
            }
            options.autoClose = false;
            bundle.obj = org;
            bundle.id = $stateParams.orgId;
            bundle.catId = $stateParams.orgId;
            bundle.catType = CATEGORY_TYPE.ORG;
            bundle.orgId = $stateParams.orgId;
            
			EventService.createEventDialog(bundle,options).then(function (res) {
				if (res && res.isSuccess) {
					$scope.OrgEventsData = {
							orgEvents: [],
							pgInfo: {
								pageSize: 25,
								currPage: 1
							}
						};
					$scope.selected = 0; 
					$scope.fStartTime = new Date().getTime()
					$scope.fEndTime = $scope.MU.getEventEndDate($scope.filters[0].type);
					getOrgEvents();
				}
			})
			.catch(function (err) {
				
			})
			.finally(function () {
			});
		}

		function getOrgEvents() {
			
			$scope.eventOwner = EVENTS.EVENT_OWNER;

			if ($scope.OrgEventsData.orgEvents.length == 0) {

				blockUI.start("Loading WorkSpace Events..", {
					status: 'isLoading'
				});
			}
			
			var _params = {
				catId: $stateParams.orgId,
				pageSize: $scope.OrgEventsData.pgInfo.pageSize,
				pageNumber: $scope.OrgEventsData.pgInfo.currPage,
				fStartTime:$scope.fStartTime,
				fEndTime:$scope.fEndTime
			};

			$scope.orgTabCtrl.orgModel.loadEvents(_params).then(function (res) {
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
					$scope.OrgEventsData.orgEvents.push(value);

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
		
		function loadOrgEventsClick(type){
			$scope.fEndTime = $scope.MU.getEventEndDate(type);
			$scope.OrgEventsData = {
					orgEvents: [],
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
			
			getOrgEvents();
		}
		
		function checkNextPgAvailability() {
			var totalResults = _rawResponse.resp.paginationMetaData.totalResults;
			if ($scope.OrgEventsData.orgEvents.length < totalResults) {
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
			$scope.OrgEventsData.pgInfo.currPage += 1;
			getOrgEvents();
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

		function toggleAudit(enable) {
			$scope.state.showAudit = !!enable;
			if ($scope.state.showAudit) {
				resetAuditPagination();
				fetchAuditPage()
			} else {
				
			}
		}
		
		function isNextAuditPageAvailable() {
			return orgEventsAuditPageLoader
				&& orgEventsAuditPageLoader.isNextPageAvailable()
		}
		
		function fetchMoreAudits() {
			fetchAuditPage();
		}

		function resetAuditPagination() {
			$scope.orgEventsAuditList = [];
			orgEventsAuditPageLoader.resetPagination();
		}
		
		$scope.editOrgEvent = function(orgEvent) {
			var org = DataProvider.resource.Organisation.get($stateParams.orgId)
			, options = options || {}
			, bundle = {};

			if (!org) {
				getOrgDetails($stateParams.orgId).then(function(org) {
					org = org;
				});
			}
			
			options.autoClose = false;
			bundle.org = org;
			bundle.orgId = $stateParams.orgId;
			bundle.catId = $stateParams.orgId;
			bundle.catType = CATEGORY_TYPE.ORG;
			bundle.eventEntity = orgEvent;
			bundle.isEdit = true;

			EventService.createEventDialog(bundle,options).then(function (res) {
				if (res && res.isSuccess) {
					$scope.OrgEventsData.orgEvents = [];
					getOrgEvents();
				}
			});
		}

		function deleteOrgEvent() {
			var params = {};
			params.catId = $stateParams.orgId;
			params.catType = CATEGORY_TYPE.ORG;
			
			blockUI.start("Fetching Events");
			
			EventService.ownedEventsList(params).then(function (res) {
				if (res.length > 0) {
					blockUI.stop();
					EventService.deleteEventDialog(res, params).then(function (res) {
						if (res && res.responseCode == 0) {
							$scope.OrgEventsData.orgEvents = [];
							$scope.selected = 0; 
							$scope.fStartTime = new Date().getTime();
							$scope.fEndTime = $scope.MU.getEventEndDate($scope.filters[0].type);
							getOrgEvents();
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
		
		function fetchAuditPage() {
			$scope.orgEventsAudit.refresh()
		}

        function getOrgDetails(orgId) {

            return DataProvider.resource.Organisation.find(orgId, {
                bypassCache: true,
                orgId: orgId
            });

        }

        function auditClicked() {
			var params = {};
			params.catId = $stateParams.orgId;
			params.catType = CATEGORY_TYPE.ORG;

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