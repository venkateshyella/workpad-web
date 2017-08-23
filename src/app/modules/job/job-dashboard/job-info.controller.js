;
(function () {
	"use strict";

	angular.module('app')
		.controller('JobInfoViewController', [
			'$scope', '$stateParams', 'blockUI',
			'DataProvider', 'mDialog', '$timeout', 'Lang', 'Session',
			'jobLifecycleEventService', 'JobAdminService','CATEGORY_TYPE','AuditService','URL', JobInfoViewController
		]);


	function JobInfoViewController($scope, $stateParams, blockUI, DataProvider, Dialog, $timeout, Lang, Session, jobLifecycleEventService, JobAdminService,CATEGORY_TYPE, AuditService, URL) {

		var jobId = $stateParams.jobId;
		var LANG = Lang.en.data;

		$scope.jobEdit = jobEdit;
		$scope.onJobLifeCycleEventTrigger = onJobLifeCycleEventTrigger;
		$scope.askAndDeleteJob = askAndDeleteJob;

		$scope.JobTabCtrl.tab_curr = 'TAB_INFO';

		$scope.JobTabCtrl.jobModel = DataProvider.resource.Job.get(jobId);
		$scope.JobTabCtrl.jobModel && $scope.JobTabCtrl.jobModel.title && ($scope.xtras.title
			= $scope.JobTabCtrl.jobModel.title);


		/*if ($scope.JobTabCtrl.jobModel) {
		 initJobInfoView();

		 } else {

		 $scope.fetchJobDetails().then(function () {
		 initJobInfoView();
		 });

		 }*/

		$scope.fetchJobDetails().then(function () {
			initJobInfoView();
		});

		function initJobInfoView() {
			getInfoMenuList();
		}

		function isJobWithStartedTasks() {
			var inProgressTasksCount = $scope.JobTabCtrl.jobModel.inprogressTaskCount;

			if (inProgressTasksCount > 0) {
				return true;
			} else {
				return false;
			}
		}

		/*function fetchJobDetails() {


		 DataProvider.resource.Job.find(jobId, {
		 bypassCache: true,
		 files: true,
		 contributors: true,
		 tasks: true
		 })
		 .then(function(jobModel) {
		 $scope.JobTabCtrl.jobModel = jobModel;
		 $scope.JobChatroomNickName = 'U' + $scope.session.userInfo.id + '-J' + $scope.JobTabCtrl.jobModel.id;

		 checkIsVisitor(jobModel.roles);


		 $timeout(function() {
		 // $scope.$broadcast("$JOB_DETAILS_UPDATE:SUCCESS", jobModel);
		 });

		 }).catch(function(error) {
		 console.log(error);

		 }).finally(function() {

		 });

		 }*/

		function getInfoMenuList() {

			$scope.JobTabCtrl.optionMenuItems.TAB_INFO = [];

			var infoMenuItems = [{
				name: LANG.BUTTON.EDIT,
				action: jobEdit,
				args: null,
				isAllowed: (
					$scope.JobTabCtrl.jobModel.canExecuteActionByRole('EDIT')
					&& $scope.JobTabCtrl.jobModel.canExecuteActionByStatus('EDIT')
				)
			}, {
				name: LANG.JOB.LABEL.LCE_NAME.TRY_START,
				action: onJobLifeCycleEventTrigger,
				args: 'TRY_START',
				isAllowed: $scope.JobTabCtrl.jobModel.canExecuteActionByRole('TRY_START') && $scope.JobTabCtrl.jobModel.canExecuteActionByStatus('TRY_START')
			}, {
				name: LANG.JOB.LABEL.LCE_NAME.TRY_FINISH,
				action: onJobLifeCycleEventTrigger,
				args: 'TRY_FINISH',
				isAllowed: $scope.JobTabCtrl.jobModel.canExecuteActionByRole('TRY_FINISH') && $scope.JobTabCtrl.jobModel.canExecuteActionByStatus('TRY_FINISH') && !isJobWithStartedTasks()
			}, {
				name: LANG.JOB.LABEL.LCE_NAME.TRY_CLOSE,
				action: onJobLifeCycleEventTrigger,
				args: 'TRY_CLOSE',
				isAllowed: $scope.JobTabCtrl.jobModel.canExecuteActionByRole('TRY_CLOSE') && $scope.JobTabCtrl.jobModel.canExecuteActionByStatus('TRY_CLOSE') && !isJobWithStartedTasks()
			}, {
				name: LANG.JOB.LABEL.DELETE_JOB,
				action: askAndDeleteJob,
				args: null,
				btn_type: "md-accent md-raised",
				isAllowed: $scope.JobTabCtrl.jobModel.canExecuteActionByRole('DELETE_JOB') && $scope.JobTabCtrl.jobModel.canExecuteActionByStatus('DELETE_JOB')
			},{
				name: "Audit",
				action: auditClicked,
				isAllowed: true
			}];
			angular.forEach(infoMenuItems, function (menuItem) {
				if (menuItem.isAllowed) {
					$scope.JobTabCtrl.optionMenuItems.TAB_INFO.push(menuItem);
				}
			});
		}

		function jobEdit() {

			var job = angular.copy($scope.JobTabCtrl.jobModel);
			JobAdminService.UpdateJob(job).then(function (result) {

				var newJobData = result;
				$scope.fetchJobDetails().then(function () {
					initJobInfoView();
				});
			}, null, function (rawResponse) {
				Dialog.showAlert(rawResponse.respMsg).then(function () {
				});
			}).catch(function (error) {
				Dialog.showAlert(error);
			});
		}

		function onJobLifeCycleEventTrigger(eventName) {

			jobLifecycleEventService.showJobLifecycleEventTriggerDialog($scope.JobTabCtrl.jobModel, eventName)
				.then(function (res) {
					$scope.fetchJobDetails().then(function () {
						initJobInfoView();
					});
				});
		}

		function askAndDeleteJob() {
			Dialog.confirm({
					title: "Delete Job",
					content: "Do you wish to delete this job ?",
					ok: LANG.BUTTON.DELETE,
					cancel: LANG.BUTTON.CANCEL
				})
				.then(function () {
					blockUI.start(LANG.JOB.JOB_LOADING_MSGS.JOB_DELETE);
					DataProvider.resource.Job.destroy(jobId)
						.then(function (res) {
							$scope.transitionBack();
							blockUI.stop(res.respMsg);
						})
						.catch(function (error) {
							blockUI.stop(error.respMsg, {
								status: 'isError',
								action: LANG.BUTTON.OK
							});
						});
				})
		}
		function auditClicked() {
			var params = {};
			params.catId = $stateParams.jobId;
			params.catType = CATEGORY_TYPE.JOB;

			blockUI.start("Fetching Audit data");
			AuditService.checkAuditList(URL.AUDIT_LIST,params).then(function (res) {
				if (res.results.length > 0) {
					var title = "";
					blockUI.stop();

					AuditService.showAudit(URL.AUDIT_LIST,params,title, res).then(function (res) {

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
					content: err.respMsg,
					ok: "Ok"
				});
			}).finally(function () {
				blockUI.stop();
			});
		}
	}


})();
