;
(function () {
	"use strict";

	angular.module('app')
		.controller('JobVerifyViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', '$timeout', 'mDialog', 'Lang', JobVerifyViewController]);

	function JobVerifyViewController($scope, $stateParams, blockUI, DataProvider, $timeout, Dialog, Lang) {

		var LANG = Lang.en.data;
		$scope.taskList = [];

		getJobModel();
		getTaskList();

		$scope.jobModel = {};
		$scope.xtras = {

			title: "Job Details",
			jobstatus: ""
		};
		$scope.onJobLifeCycleEventTrigger = onJobLifeCycleEventTrigger;

		function onJobLifeCycleEventTrigger(eventName) {

			Dialog.show({
				controller: ['$scope', '$mdDialog', 'jobModel', 'lifecycleEvent', 'Lang', jobStatusChangeDialogController],
				templateUrl: 'app/modules/job/templates/job-event-trigger.dialog.tpl.html',
				locals: {
					jobModel: $scope.jobModel,
					lifecycleEvent: eventName
				}
			});

			function jobStatusChangeDialogController($scope, $mdDialog, jobModel, lifecycleEvent, Lang) {

				$scope.form = {};
				$scope.formModel = {};
				$scope.formModel.jobStatusChange = {};
				$scope.isMandatory = false;
				$scope.lifecycleEvent = lifecycleEvent;
				$scope.LANG = Lang.en.data;

				if (lifecycleEvent == "TRY_REJECT") {
					$scope.isMandatory = true;
				}

				$scope.cancel = function () {
					$mdDialog.hide();
				};
				$scope.submit = function submit() {
					var comment = $scope.formModel.comment;
					switchJobChangeEvent(lifecycleEvent, comment);
					$mdDialog.hide();
				}

				console.log($scope.lifecycleEvent);

			}
		}

		function switchJobChangeEvent(lifecycleEvent, comment) {
			var tryEventName;
			switch (lifecycleEvent) {

				case "TRY_CLOSE":
					tryEventName = 'try_close';
					break;
				case "TRY_REJECT":
					tryEventName = 'try_reject';
					break;
			}

			$scope.jobModel[tryEventName](comment)
				.then(function (res) {

					Dialog.alert({
						content: res.respMsg,
						ok: LANG.BUTTON.OK
					}).then(function () {

						$scope.transitionTo('root.app.job-view', {
							jobId: parseInt($stateParams.jobId)
						});

					});

					$timeout(function () {
					});
				})
				.catch(function (err) {
					Dialog.alert({
						content: err.respMsg,
						ok: LANG.BUTTON.OK
					}).then(function () {

						$scope.transitionTo('root.app.job-view', {
							jobId: parseInt($stateParams.jobId)
						});

					});

				});

		}


		function getTaskList() {

			blockUI.start("Loading Tasks", {
				status: 'isLoading'
			});

			DataProvider.resource.Task.findAll({
				jobId: $stateParams.jobId
			}, {
				bypassCache: true
			})
				.then(function (taskList) {

					// $scope.taskList = DataProvider.resource.Task.getAll();

					$scope.taskList = DataProvider.resource.Task.filter({
						where: {
							jobId: parseInt($stateParams.jobId)
						}
					});
					console.log($scope.taskList);


				}).catch(function (error) {

					blockUI.stop(error.respMsg, {
						status: 'isError',
						action: 'Ok'
					});

				}).finally(function () {
					blockUI.stop();

				});
		}

		function getJobModel() {
			var jobId = parseInt($stateParams.jobId);
			DataProvider.resource.Job.find(jobId, {
				bypassCache: true,
				files: true
			})
				.then(function (jobModel) {
					$scope.jobModel = DataProvider.resource.Job.get(jobId);

					$scope.xtras.title = jobModel.title;
					$scope.xtras.jobstatus = jobModel.displayStatus;
					console.log($scope.jobModel);
					$timeout(angular.noop);
				})


		}

	}

})();
