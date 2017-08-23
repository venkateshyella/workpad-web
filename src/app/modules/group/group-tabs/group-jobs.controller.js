;
(function () {
	"use strict";

	angular.module('app')
		.controller('GroupJobsViewController', ['$scope', '$stateParams',
			'DataProvider', 'mDialog','$timeout', 'Lang',
			'JOB', 'GroupService', 'JobAdminService', 'CATEGORY_TYPE', 'blockUI', 'AuditService', 'URL', GroupJobsViewController]);


	function GroupJobsViewController($scope, $stateParams
		, DataProvider, Dialog,$timeout, Lang
		, JOB, GroupService, JobAdminService, CATEGORY_TYPE, blockUI, AuditService ,URL) {

		var groupId = $scope.groupTabCtrl.groupId || $stateParams.groupId
			, LANG = Lang.en.data,_rawResponse;
		/**
		 * Org Data Audit
		 * */
		$scope.groupAuditCollection = [];
		$scope.groupAuditPageLoader = GroupService
			.createGroupJobAuditListLoader(groupId, $scope.groupAuditCollection);

		$scope.state = {
			showAudit: false
		};
		$scope.xtras.selectedTabIndex = 6;

		$scope.GroupJobsdata = {
			groupJobs: [],
			pgInfo: {
				pageSize: 25,
				currPage: 1
			}
		};
		$scope.isNextGroupJobPageAvailable = false;
		$scope.isLoading = false;

		$scope.jobItemClickAction = jobItemClickAction;

		$scope.toggleAudit = function (enable) {
			$scope.state.showAudit = !!enable;
		};

		$scope.groupTabCtrl.groupModel = DataProvider.resource.Group.get(groupId);

		$scope.ROLE_NAMES = JOB.ROLE_NAMES;

		if ($scope.groupTabCtrl.groupModel && $scope.groupTabCtrl.orgModel) {
			initGroupJobsView();
		} else {

			$scope.getGroupModelAndOrgModel().then(function () {
				initGroupJobsView();
			});

		}

		function initGroupJobsView() {
			getGroupJobs();
			getJobsTabMenuList();
		}


		function getJobsTabMenuList() {

			$scope.groupTabCtrl.optionMenuItems.TAB_JOBS = [];

			var jobTabMenuItems = [{
				name: "Create Job",
				action: createThenEditJob,
				isAllowed: $scope.groupTabCtrl.groupModel.isActionAuthorized('CREATE_JOB')
			},{
				name: "Audit",
				action: auditClicked,
				isAllowed: true
			}];

			angular.forEach(jobTabMenuItems, function (menuItem) {
				if (menuItem.isAllowed) {
					$scope.groupTabCtrl.optionMenuItems.TAB_JOBS.push(menuItem);
				}
			});

		}

		function createThenEditJob() {
			//For creation of Job in group groupId is mandatory

			var groupId = $stateParams.groupId;
			var orgId = $stateParams.orgId;
			JobAdminService.CreateJob(orgId, groupId).then(function (job) {
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
		
		function auditClicked() {
			var params = {};
			params.groupId = $stateParams.groupId;

			blockUI.start("Fetching Audit data");
			AuditService.checkAuditList(URL.GROUP_JOBS_AUDIT,params).then(function (res) {
				if (res.results.length > 0) {
					var title = "Data";
					blockUI.stop();
					AuditService.showAudit(URL.GROUP_JOBS_AUDIT,params,title, res).then(function (res) {

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


		function getGroupJobs() {
			
			if ($scope.GroupJobsdata.groupJobs.length == 0) {
				blockUI.start("Loading Job Data..", {
					status: 'isLoading'
				});
			}
			var _params = {
				groupId: $stateParams.groupId,
				orgId: $stateParams.orgId,
				pageSize: $scope.GroupJobsdata.pgInfo.pageSize,
				pageNumber: $scope.GroupJobsdata.pgInfo.currPage
			};
			$scope.groupTabCtrl.groupModel.loadJobs(_params).then(function (res) {
				$scope.isLoading = false;
				angular.forEach(res, function (value, key) {
					$scope.GroupJobsdata.groupJobs.push(value);
					
				});
				$timeout();
				//$scope.GroupJobsdata.groupJobs = res;
				checkNextPgAvailability();
			}, null, function (rawResponse) {
				_rawResponse = rawResponse;
			}).catch(function (error) {
				console.log(error);
			}).finally(function () {
				blockUI.stop();
			});
		}
		
		/* started code for job pagination*/
		function checkNextPgAvailability() {
			var totalResults = _rawResponse.resp.paginationMetaData.totalResults;
			if ($scope.GroupJobsdata.groupJobs.length < totalResults) {
				$scope.isNextGroupJobPageAvailable = true;
			} else {
				$scope.isNextGroupJobPageAvailable = false;
			}
		}
		

		$scope.loadNextGroupJobPage = function() {
			$scope.isLoading = true;
			$scope.GroupJobsdata.pgInfo.currPage += 1;
			getGroupJobs();
		}
		/* ended code for job pagination*/
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

	}


})();
