/*;
 (function() {
 "use strict";

 angular.module('app')
 .controller('PTJobListViewController', ['$scope', '$controller', '$stateParams', 'blockUI',
 'DataProvider', '$timeout', '$state', 'JobService', PTJobListViewController
 ]);

 function PTJobListViewController($scope, $controller, $stateParams, blockUI,
 DataProvider, $timeout, $state, JobService) {

 $scope.areMoreTimesheetJobsAvailable = false;
 $scope.loadMoreJobsClick = loadMoreJobsClick;

 var pageNumber  = 1;

 _initTimesheetTab(pageNumber);


 function loadMoreJobsClick(){
 _initTimesheetTab(pageNumber);
 }


 function _initTimesheetTab(pageNumber) {

 blockUI.start("Loding Jobs timesheet list");


 var params = angular.extend({}, JobService.pendingTimeSheetJobs.params, {
 pageNumber: pageNumber,
 pageSize: 1
 });
 JobService.pendingTimeSheetJobs.fetch(params, {
 bypassCache: true
 }).then(function(response) {
 $scope.pendingTimesheetJobsList = _.uniq($scope.pendingTimesheetJobsList.concat(response));
 blockUI.stop();
 $timeout();
 }, null,
 function(noti) {
 if(noti.resp.results.length < noti.resp.paginationMetaData.totalResults){
 $scope.areMoreTimesheetJobsAvailable = true;
 pageNumber = pageNumber+1;
 }
 else{
 $scope.areMoreTimesheetJobsAvailable = false;
 }
 console.log('noti', noti);
 }).catch(function(err) {
 var errMsg = (err && err.respMsg) || LANG.ERROR.DEFAULT;
 blockUI.stop(errMsg, {
 status: 'isError',
 action: LANG.BUTTON.OK
 });
 })
 .finally(function() {});



 }

 $scope.jobItemTimesheetClickAction = jobItemTimesheetClickAction;
 function jobItemTimesheetClickAction($event, job) {
 JobService.sumbitTimesheetReq(job).then(function(res){
 if(res.isSuccess==true){
 _initTimesheetTab();
 }
 });
 }
 }

 })();*/


;
(function () {
	"use strict";

	angular.module('app')
		.controller('PTJobListViewController', ['$scope', '$stateParams'
			, 'blockUI', 'DataProvider', '$timeout', 'JobService', 'mDialog'
			, PTJobListViewController]);

	function PTJobListViewController($scope, $stateParams, blockUI, DataProvider, $timeout, JobService, Dialog) {


		$scope.pendingTimesheetJobsList = [];
		$scope.isNextPageAvailable = false;
		$scope.fetchMoreJobs = fetchMoreJobs;
		$scope.refresh = refresh;
		$scope.jobItemClickAction = jobItemClickAction;

		$scope.showNoDataMsg = false;
		$scope.loadingImage = true;
		$scope.showMsgContainer = true;

		var _currPageNumber = 1;
		var _defaultPageSize = 25;
		
		$scope.xtras.selectedTabIndex = 1;

		getJobsList(_currPageNumber, _defaultPageSize);

		function getJobsList(pageNumber, pageSize) {

			blockUI.start($scope.LANG.JOB.JOB_LOADING_MSGS.JOBS_LOAD, {
				status: 'isLoading'
			});

			DataProvider.resource.Job.findAll({
					type: 2,
					pageNumber: pageNumber,
					pageSize: pageSize
				}, {
					bypassCache: true
				}
				)
				.then(function (JobList) {
					//  $scope.pendingTimesheetJobsList = _.uniq($scope.pendingTimesheetJobsList.concat(JobList));
					$scope.pendingTimesheetJobsList = JobList;
					if ($scope.pendingTimesheetJobsList.length == 0) {
						$scope.showNoDataMsg = true;
					} else {
						$scope.showMsgContainer = false;
						$scope.loadingImage = false;
					}

					var metaDataObj = angular.copy(DataProvider.resource.Job.methods.getMeta());
					if ($scope.pendingTimesheetJobsList.length < metaDataObj.paginationMetaData.totalResults) {
						$scope.isNextPageAvailable = true;
					} else {
						$scope.isNextPageAvailable = false;
					}

					$timeout(function () {
					});

				})
				.catch(function (error) {

					// $scope.showNoDataMsg = true;

				})
				.finally(function () {
					blockUI.stop();

				});
		}

		function fetchMoreJobs() {
			_currPageNumber = _currPageNumber + 1;
			getJobsList(_currPageNumber, _defaultPageSize);
		}

		function jobItemClickAction($event, job) {
			JobService.sumbitTimesheetReq(job).then(function (res) {
				if (res.isSuccess == true) {
					Dialog.alert({
						content: "Timesheet submitted.",
						ok: LANG.BUTTON.OK
					});
					getJobsList(_currPageNumber, _defaultPageSize);
				}
			});
		}

		function refresh() {
			// $scope.jobList = [];
			$scope.isNextPageAvailable = false;
			_currPageNumber = 1;
			getJobsList(_currPageNumber, _defaultPageSize);
		}

	}

})();

