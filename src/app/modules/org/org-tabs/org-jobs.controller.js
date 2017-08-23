;
(function () {
	"use strict";

	angular.module('app')
		.controller('OrgJobsViewController', [
			'$scope', '$stateParams', 'blockUI',
			'DataProvider', 'mDialog', '$timeout', '$controller',
			'Lang', 'Session',
			'JOB', 'JobAdminService', 'OrganisationService','AuditService','URL', OrgJobsViewController])
	;

	function OrgJobsViewController($scope, $stateParams, blockUI
		, DataProvider, Dialog, $timeout, $controller
		, Lang, Session, JOB, JobAdminService, OrganisationService, AuditService, URL) {

		var self = this
			, LANG = Lang.en.data
			, orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId
			, _rawResponse
			, orgJobsAuditPageLoader
			, orgJobsAuditLoader
			, orgJobsCollection = []
			;

		_init();

		function _init() {
			$scope.ui = {
					isRefreshing: false,
					isLoadingNext: false,
					isAuditSelected: false
				};
			
			angular.extend(self, $controller('ViewDataBaseController', {
				$scope: $scope
			}));
			$scope.xtras.selectedTabIndex = 6;
			$scope.state = {
				showAudit: false
			};

			$scope.OrgJobsdata = {
				orgJobs: [],
				pgInfo: {
					pageSize: 25,
					currPage: 1
				}
			};
			$scope.orgJobsAuditList = [];
			$scope.orgTabCtrl.orgModel = DataProvider.resource.Organisation.get(orgId);

			$scope.ROLE_NAMES = JOB.ROLE_NAMES;

			$scope.isNextPageAvailable = false;
			$scope.loadingNext = false;

			orgJobsAuditPageLoader = OrganisationService.createOrgJobAuditListLoader(orgId, orgJobsCollection);
			orgJobsAuditLoader = self.initializeViewDataBaseController('orgJobsAudit',
				function () {
					return orgJobsAuditPageLoader.fn()
						.then(function (audits) {
							"use strict";
							$scope.orgJobsAuditList = _.uniq($scope.orgJobsAuditList.concat(audits));
							return $scope.orgJobsAuditList;
						});
				});

			$scope.ui.auditActivityStore = orgJobsAuditPageLoader.getActivityStore();
			
			$scope.jobItemClickAction = jobItemClickAction;
			$scope.loadNext = loadNext;
			$scope.toggleAudit = toggleAudit;
		}

		if ($scope.orgTabCtrl.orgModel) {
			initOrgGroupView();
		} else {
			$scope.getOrgDetails().then(function () {
				initOrgGroupView();
			});
		}

		function initOrgGroupView() {
			getOrgJobs();
			getJobsTabMenuList();
		}

		function getJobsTabMenuList() {

			$scope.orgTabCtrl.optionMenuItems.TAB_JOBS = [];

			var jobTabMenuItems = [{
				name: "Create Job",
				action: createThenEditJob,
				isAllowed: $scope.orgTabCtrl.orgModel.isActionAuthorized('CREATE_JOB')
			},{
				name: "Audit",
				action: auditClicked,
				isAllowed: true
			}];

			angular.forEach(jobTabMenuItems, function (menuItem) {
				if (menuItem.isAllowed) {
					$scope.orgTabCtrl.optionMenuItems.TAB_JOBS.push(menuItem);
				}
			});
		}

		function createThenEditJob() {
			JobAdminService.CreateJob(orgId).then(function (job) {
				if (job.resp.id) {
					$scope.transitionTo('root.app.job-view.jobProfile', {
						jobId: job.resp.id
					}, {REPLACE_STATE: false});
				}
			}).catch(function (error) {
				Dialog.alert({
					content: error.message,
					ok: LANG.BUTTON.OK
				});
			}).finally(function () {
				blockUI.stop();
			});
		}

		function getOrgJobs() {

			if ($scope.OrgJobsdata.orgJobs.length == 0) {

				blockUI.start("Loading WorkSpace Work..", {
					status: 'isLoading'
				});
			}
			var _params = {
				orgId: $stateParams.orgId,
				pageSize: $scope.OrgJobsdata.pgInfo.pageSize,
				pageNumber: $scope.OrgJobsdata.pgInfo.currPage
			};
			$scope.orgTabCtrl.orgModel.loadJobs(_params).then(function (res) {
				$scope.loadingNext = false;
				angular.forEach(res, function (value, key) {
					$scope.OrgJobsdata.orgJobs.push(value);
					$scope.OrgJobsdata.orgJobs = _.uniq($scope.OrgJobsdata.orgJobs, function (job, key, id) {
						return job.id;
					});
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

		function checkNextPgAvailability() {
			var totalResults = _rawResponse.resp.paginationMetaData.totalResults;
			if ($scope.OrgJobsdata.orgJobs.length < totalResults) {
				$scope.isNextPageAvailable = true;
			} else {
				$scope.isNextPageAvailable = false;
			}
		}

		function loadNext() {
			$scope.loadingNext = true;
			$scope.OrgJobsdata.pgInfo.currPage += 1;
			getOrgJobs();
		}

		function jobItemClickAction($event, job) {


			var role = job.roles;

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
			}

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
			$scope.orgJobsAudit.refresh();
		}
		
		function resetAuditPagination() {
			$scope.orgJobsAuditList = [];
			orgJobsAuditPageLoader.resetPagination();
		}
		
		$scope.fetchMoreAudits = function(){
			fetchAuditPage();
		}
		
		$scope.isNextAuditPageAvailable = function(){
			return orgJobsAuditPageLoader
				&& orgJobsAuditPageLoader.isNextPageAvailable();
		}
		
		function auditClicked() {
			var params = {};
			params.orgId = $stateParams.orgId;

			blockUI.start("Fetching Audit data");
			AuditService.checkAuditList(URL.ORG_JOBS_AUDIT,params).then(function (res) {
				if (res.results.length > 0) {
					var title = "Work";
					blockUI.stop();
					AuditService.showAudit(URL.ORG_JOBS_AUDIT,params,title, res).then(function (res) {

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