/**
 * Created by sandeep on 28-SEP-2016
 */
;
(function () {
	"use strict";

	angular.module('app')
	.controller('GroupJobTemplateViewController', [
	                                             '$scope', '$stateParams', 'blockUI',
	                                             'DataProvider', 'mDialog', '$timeout', '$controller','Connect','URL',
	                                             'Lang', 'Session',
	                                             '$mdToast','JobTemplateService','GroupService','CATEGORY_TYPE','AuditService',GroupJobTemplateViewController])
	                                             ;

	function GroupJobTemplateViewController($scope, $stateParams, blockUI
			, DataProvider, Dialog, $timeout, $controller, Connect, URL
			, Lang, Session, $mdToast,JobTemplateService,GroupService,CATEGORY_TYPE,AuditService) {


		var self = this
		, LANG = Lang.en.data
		, orgId = $scope.groupTabCtrl.orgId || $stateParams.orgId
		, groupId = $stateParams.groupId
		, _rawResponse
		, groupTemplatesAuditPageLoader
		, groupTemplatesAuditLoader
		, groupTemplatesCollection = []
		;

		$scope.userId = Session.userId;

		_init();

		function _init() {
			angular.extend(self, $controller('ViewDataBaseController', {
				$scope: $scope
			}));

			$scope.xtras.selectedTabIndex = 9;
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

			$scope.groupTemplatesAuditList = [];
			$scope.groupTabCtrl.groupModel = DataProvider.resource.Group.get(groupId);

			/**
			 * group templates audits
			 */
			groupTemplatesAuditPageLoader = GroupService.createGroupTemplateAuditListLoader(groupId, groupTemplatesCollection);
			groupTemplatesAuditLoader = self.initializeViewDataBaseController('groupTemplatesAudit',
					function () {
				return groupTemplatesAuditPageLoader.fn()
				.then(function (audits) {
					"use strict";
					$scope.groupTemplatesAuditList = _.uniq($scope.groupTemplatesAuditList.concat(audits));
					return $scope.groupTemplatesAuditList;
				});
			});
			
			$scope.ui.auditActivityStore = groupTemplatesAuditPageLoader.getActivityStore(); 

			$scope.loadNext = loadNext;
			$scope.toggleAudit = toggleAudit;
			$scope.loadGroupTemplatesClick = loadGroupTemplatesClick;
			$scope.editJobTemplate = editJobTemplate;
			$scope.isNextAuditPageAvailable = isNextAuditPageAvailable;
			$scope.fetchMoreAudits = fetchMoreAudits;
		}


		$scope.getGroupModelAndOrgModel().then(function() {
			initGroupJobTemplateView();
		});

		function initGroupJobTemplateView() {
			getTemplatesTabMenuList();
			getJobTemplatesList();
		}

		function getTemplatesTabMenuList() {

			$scope.groupTabCtrl.optionMenuItems.TAB_TEMPLATE = [];

			var templateTabMenuItems = [{
				name: "Create Template",
				action: clickOnAddTemplate,
				isAllowed: true
			},{
				name: "Create Template by using Job",
				action: createGroupTemplateFromJob,
				isAllowed: false
			},{
				name: "Delete Template",
				action: deleteGroupTemplate,
				isAllowed: true
			},{
				name: "Audit",
				action: auditClicked,
				isAllowed: true
			}];

			$scope.state = {
					showAudit: false
			};

			angular.forEach(templateTabMenuItems, function (menuItem) {
				if (menuItem.isAllowed) {
					$scope.groupTabCtrl.optionMenuItems.TAB_TEMPLATE.push(menuItem);
				}
			});
		}

		function getJobTemplatesList() {

			if ($scope.JobTemplatesData.jobTemplates.length == 0) {

				blockUI.start("Loading Room templates...", {
					status: 'isLoading'
				});
			}

			var _params = {
					orgId: $stateParams.orgId,
					groupId: $stateParams.groupId,
					pageSize: $scope.JobTemplatesData.pgInfo.pageSize,
					pageNumber: $scope.JobTemplatesData.pgInfo.currPage
			};

			$scope.groupTabCtrl.groupModel.loadJobTemplates(_params).then(function (res) {
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

		
		function createGroupTemplateFromJob() {
			JobTemplateService.closedJobsListForOrg(orgId).then(function (res) {
				if (res.length > 0) {
					JobTemplateService.createJobTemplateDialog(orgId,groupId,null,res).then(function (res) {
						if (res.isSuccess) {
							loadGroupTemplatesClick();	
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
		
		function loadGroupTemplatesClick(){
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
			JobTemplateService.createJobTemplateDialog(orgId, groupId).then(function (res) {
				if (res.isSuccess) {
					loadGroupTemplatesClick();	
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
			
			JobTemplateService.createJobTemplateDialog(orgId, groupId, templateObj).then(function (res) {
				if (res.isSuccess) {
					loadGroupTemplatesClick();	
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
			$scope.groupTemplatesAudit.refresh()
		}
		
		function isNextAuditPageAvailable() {
			return groupTemplatesAuditPageLoader
				&& groupTemplatesAuditPageLoader.isNextPageAvailable()
		}
		
		function fetchMoreAudits() {
			fetchAuditPage();
		}

		function resetAuditPagination() {
			$scope.groupTemplatesAuditList = [];
			groupTemplatesAuditPageLoader.resetPagination();
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
		
		function deleteGroupTemplate() {
			var params = {};
			params.catId = $stateParams.groupId;
			params.catType = CATEGORY_TYPE.GROUP;
			
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
		
		function auditClicked() {
			var params = {};
			params.catId = $stateParams.groupId;
			params.catType = CATEGORY_TYPE.GROUP;

			blockUI.start("Fetching Audit data");
			AuditService.checkAuditList(URL.JOB_TEMPLATE_AUDIT,params).then(function (res) {
				if (res.results.length > 0) {
					var title = "";
					blockUI.stop();
					AuditService.showAudit(URL.VAULT_AUDIT_LIST,params,title, res).then(function (res) {

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