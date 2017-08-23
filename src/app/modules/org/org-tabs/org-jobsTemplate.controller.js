/**
 * Created by sandeep on 28-SEP-2016
 */
;
(function () {
	"use strict";

	angular.module('app')
	.controller('OrgJobTemplateViewController', [
	                                             '$scope', '$stateParams', 'blockUI',
	                                             'DataProvider', 'mDialog', '$timeout', '$controller','Connect','URL',
	                                             'Lang', 'Session',
	                                             '$mdToast','JobTemplateService','OrganisationService','CATEGORY_TYPE','AuditService',OrgJobTemplateViewController])
	                                             ;

	function OrgJobTemplateViewController($scope, $stateParams, blockUI
			, DataProvider, Dialog, $timeout, $controller, Connect, URL
			, Lang, Session, $mdToast,JobTemplateService,OrganisationService,CATEGORY_TYPE,AuditService) {


		var self = this
		, LANG = Lang.en.data
		, orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId
		, _rawResponse
		, orgTemplatesAuditPageLoader
		, orgTemplatesAuditLoader
		, orgTemplatesCollection = []
		;

		$scope.userId = Session.userId;

		_init();

		function _init() {
			angular.extend(self, $controller('ViewDataBaseController', {
				$scope: $scope
			}));

			$scope.xtras.selectedTabIndex = 8;
			$scope.toggleAudit = toggleAudit;

			$scope.isNextPageAvailable = false;
			$scope.loadingNext = false;

			$scope.JobTemplatesData = {
					jobTemplates: [],
					pgInfo: {
						pageSize: 25,
						currPage: 1
					}
			};

			$scope.orgTemplatesAuditList = [];
			$scope.orgTabCtrl.orgModel = DataProvider.resource.Organisation.get(orgId);

			/**
			 * org templates audits
			 */
			orgTemplatesAuditPageLoader = OrganisationService.createOrgTemplatesAuditListLoader(orgId, orgTemplatesCollection);
			orgTemplatesAuditLoader = self.initializeViewDataBaseController('orgTemplatesAudit',
					function () {
				return orgTemplatesAuditPageLoader.fn()
				.then(function (audits) {
					"use strict";
					$scope.orgTemplatesAuditList = _.uniq($scope.orgTemplatesAuditList.concat(audits));
					return $scope.orgTemplatesAuditList;
				});
			});
			$scope.ui.auditActivityStore = orgTemplatesAuditPageLoader.getActivityStore(); 

			$scope.loadNext = loadNext;
			$scope.toggleAudit = toggleAudit;
			$scope.loadOrgTemplatesClick = loadOrgTemplatesClick;
			$scope.editJobTemplate = editJobTemplate;
			$scope.isNextAuditPageAvailable = isNextAuditPageAvailable;
			$scope.fetchMoreAudits = fetchMoreAudits;
		}


		if ($scope.orgTabCtrl.orgModel) {
			initOrgJobTemplateView();
		} else {
			$scope.getOrgDetails().then(function () {
				initOrgJobTemplateView();
			});
		}

		function initOrgJobTemplateView() {
			getEventsTabMenuList();
			getJobTemplatesList();
		}

		function getEventsTabMenuList() {

			$scope.orgTabCtrl.optionMenuItems.TAB_TEMPLATE = [];

			var eventTabMenuItems = [{
				name: "Create Template",
				action: clickOnAddTemplate,
				isAllowed: true
			},{
				name: "Create Template by using Job",
				action: createOrgTemplateFromJob,
				isAllowed: false
			},{
				name: "Delete Template",
				action: deleteOrgTemplate,
				isAllowed: true
			},{
				name: "Audit",
				action: auditClicked,
				isAllowed: true
			}];

			$scope.state = {
					showAudit: false
			};

			angular.forEach(eventTabMenuItems, function (menuItem) {
				if (menuItem.isAllowed) {
					$scope.orgTabCtrl.optionMenuItems.TAB_TEMPLATE.push(menuItem);
				}
			});
		}

		function getJobTemplatesList() {

			if ($scope.JobTemplatesData.jobTemplates.length == 0) {

				blockUI.start("Loading...", {
					status: 'isLoading'
				});
			}

			var _params = {
					orgId: $stateParams.orgId,
					pageSize: $scope.JobTemplatesData.pgInfo.pageSize,
					pageNumber: $scope.JobTemplatesData.pgInfo.currPage
			};

			$scope.orgTabCtrl.orgModel.loadJobTemplates(_params).then(function (res) {
				$scope.loadingNext = false;
				angular.forEach(res, function (value, key) {
					$scope.JobTemplatesData.jobTemplates.push(value);
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
		
		function deleteOrgTemplate() {
			var params = {};
			params.catId = $stateParams.orgId;
			params.catType = CATEGORY_TYPE.ORG;
			
			blockUI.start("Fetching Templates");
			
			JobTemplateService.ownedTemplatesList(params).then(function (res) {
				if (res.length > 0) {
					blockUI.stop();
					JobTemplateService.deleteTemplateDialog(res, params).then(function (res) {
						if (res && res.responseCode == 0) {
							$scope.JobTemplatesData.jobTemplates = [];
							getJobTemplatesList();
							var toast = $mdToast.simple()
							.content("Template Deleted successfully")
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
					blockUI.stop("No Templates available", {
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

		function loadOrgTemplatesClick(){
			$scope.JobTemplatesData = {
					jobTemplates: [],
					pgInfo: {
						pageSize: 25,
						currPage: 1
					}
			};

			getJobTemplatesList();
		}

		function checkNextPgAvailability() {
			var totalResults = _rawResponse.resp.paginationMetaData.totalResults;
			if ($scope.JobTemplatesData.jobTemplates.length < totalResults) {
				$scope.isNextPageAvailable = true;
			} else {
				$scope.isNextPageAvailable = false;
			}
		}

		function clickOnAddTemplate() {
			JobTemplateService.createJobTemplateDialog(orgId,null,null,null).then(function (res) {
				if (res.isSuccess) {
					loadOrgTemplatesClick();	
				}
			})
			.catch(function (err) {
				Dialog.alert({
					content: err.message,
					ok: "Ok"
				});
			}).finally(function () {
			});
		}
		
		function createOrgTemplateFromJob() {
			JobTemplateService.closedJobsListForOrg(orgId).then(function (res) {
				if (res.length > 0) {
					JobTemplateService.createJobTemplateDialog(orgId,null,null,res).then(function (res) {
						if (res.isSuccess) {
							loadOrgTemplatesClick();	
						}
					}).catch(function (err) {
						Dialog.alert({
							content: err.message,
							ok: "Ok"
						});
					}).finally(function () {
					});

				} else {
					Dialog.alert({
						content: "No Jobs Available",
						ok: "Ok"
					});	
				}

			})
			.catch(function (err) {
				Dialog.alert({
					content: err.message,
					ok: "Ok"
				});
			}).finally(function () {
			});
		}

		function editJobTemplate(template) {
			var templateObj = {};
			var tasks = [];
			
			angular.extend(templateObj, template);
			angular.extend(tasks, template.tasks);
			templateObj.tasks = tasks; 
			
			JobTemplateService.createJobTemplateDialog(orgId, null, templateObj, null).then(function (res) {
				if (res.isSuccess) {
					loadOrgTemplatesClick();	
				}
			})
			.catch(function (err) {
				Dialog.alert({
					content: err.message,
					ok: "Ok"
				});
			}).finally(function () {
			});
		}

		function loadNext() {
			$scope.loadingNext = true;
			$scope.JobTemplatesData.pgInfo.currPage += 1;
			getJobTemplatesList();
		}


		function toggleAudit(enable) {
			$scope.state.showAudit = !!enable;
			if ($scope.state.showAudit) {
				resetAuditPagination();
				fetchAuditPage();
			} else {

			}
		}
		
		function fetchAuditPage() {
			$scope.orgTemplatesAudit.refresh()
		}
		
		function isNextAuditPageAvailable() {
			return orgTemplatesAuditPageLoader
				&& orgTemplatesAuditPageLoader.isNextPageAvailable()
		}
		
		function fetchMoreAudits() {
			fetchAuditPage();
		}

		function resetAuditPagination() {
			$scope.orgTemplatesAuditList = [];
			orgTemplatesAuditPageLoader.resetPagination();
		}

		$scope.viewTemplateTaskFlagMeta = {};
		$scope.toggleTemplateTask = function(event) {
			$scope.viewTemplateTaskFlagMeta[event] = !$scope.viewTemplateTaskFlagMeta[event];
		}

		$scope.viewTemplateOwnerFlagMeta = {};
		$scope.toggleTemplateOwner = function(event) {
			$scope.viewTemplateOwnerFlagMeta[event] = !$scope.viewTemplateOwnerFlagMeta[event];
		}

		$scope.viewTemplateMemFlagMeta = {};
		$scope.toggleTemplateMem = function(event) {
			$scope.viewTemplateMemFlagMeta[event] = !$scope.viewTemplateMemFlagMeta[event];
		}
		
		function auditClicked() {
			var params = {};
			params.catId = $stateParams.orgId;
			params.catType = CATEGORY_TYPE.ORG;
			
			blockUI.start("Fetching Audit data");
			AuditService.checkAuditList(URL.JOB_TEMPLATE_AUDIT,params).then(function (res) {
				if (res.results.length > 0) {
					var title = "";
					blockUI.stop();
					AuditService.showAudit(URL.JOB_TEMPLATE_AUDIT,params,title, res).then(function (res) {

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