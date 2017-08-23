/**
 * Created by sudhir on 27/5/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.service('JobService', ['$q', '$timeout', 'mDialog',
			'Session', 'DataProvider',
			'AUDIT', 'AppCoreUtilityServices', 'URL',
			JobService
		]);

	function JobService($q, $timeout, Dialog
		, Session, DataProvider
		, AUDIT, AppCoreUtilityServices, URL) {

		var openJobs = [],
			pendingRatingJobs = [],
			pendingTimeSheetJobs = [];

		_constructor();

		function _constructor() {
			DataProvider.resource.Job.createCollection(openJobs, {
				type: 1
			});

			DataProvider.resource.Job.createCollection(pendingRatingJobs, {
				type: 3
			});

			DataProvider.resource.Job.createCollection(pendingTimeSheetJobs, {
				type: 2
			});

		}

		return {
			submitUpdateJobReq: submitUpdateJobReq,
			submitCreateJobReq: submitCreateJobReq,
			sumbitTimesheetReq: sumbitTimesheetReq,
			createAuditListCollectionLoader: createJobAuditListCollectionLoader,
			createOpenJobsAuditPageLoader: createOpenJobsAuditPageLoader,
			createJobVaultAuditListLoader: createJobVaultAuditListLoader,
			createJobMeetingAuditListLoader : createJobMeetingAuditListLoader,

			contentProvider: {
				myJobListFinder: myJobListFinder,
			},
			/**
			 * Open Jobs collection.
			 * @returns {Array}
			 */
			get openJobs() {
				return openJobs
			},
			/**
			 * Jobs with pending ratings.
			 * @returns {Array}
			 */
			get pendingRatingJobs() {
				return pendingRatingJobs
			},
			/**
			 * Jobs with pending timesheet.
			 * @returns {Array}
			 */
			get pendingTimeSheetJobs() {
				return pendingTimeSheetJobs
			}
		};

		function createJobAuditListCollectionLoader(jobId, auditListArray) {
			DataProvider.resource.Audit.createCollection(auditListArray, {
				catType: 3,
				catId: jobId
			});
			return DataProvider.PaginatedListLoaderFactory(
				auditListArray, 'fetch', {
					catType: 3,
					catId: jobId
				}, 25, {
					apiParams: {bypassCache: true}
				})
		}

		/**
		 * Fetch audit list for Open jobs list
		 * */
		function createOpenJobsAuditPageLoader(auditListArray) {
			DataProvider.resource.Audit.createCollection(auditListArray, {});
			return DataProvider.PaginatedListLoaderFactory(
				auditListArray, 'fetch', {}, 25, {
					apiParams: {
						url: URL.OPEN_JOB_AUDIT_LIST,
						bypassCache: true
					}
				})
		}

		/**
		 * Fetch Job data audits
		 * */
		function createJobVaultAuditListLoader(jobId, auditListArray) {
			/*
			 For Organization catType = 1;
			 For Group catType = 2;
			 For Job catType = 3;
			 For Task catType = 4;
			 */

			var auditPageLoader = AUDIT.AuditPageFactory(auditListArray, URL.JOB_VAULT_AUDIT_LIST, {
				catId: jobId,
				catType: 3
			});
			return auditPageLoader;
		}
		
		/**
		 * Fetch Job data audits
		 * */
		function createJobMeetingAuditListLoader(jobId, auditListArray) {
			/*
			 For Organization catType = 1;
			 For Group catType = 2;
			 For Job catType = 3;
			 For Task catType = 4;
			 */

			var auditPageLoader = AUDIT.AuditPageFactory(auditListArray, URL.MEETING_AUDIT, {
				catId: jobId,
				catType: 3
			});
			return auditPageLoader;
		}

		function myJobListFinder(options) {
			var self = this;

			return new queryRunner(options);

			function queryRunner(options) {
				var self = this;
				self.options = options;
				self.status = {};
				return {
					fn: execute,
					isLoading: isLoading
				};

				function isLoading() {
					return self.status.isLoading;
				}

				function execute(key) {
					var deferred = $q.defer(),
						fuzzyFinder;
					var preFetchedResults = DataProvider.resource.Job.filter({
						where: {
							adminId: Session.userId
						}
					});
					fuzzyFinder = AppCoreUtilityServices.fuzzyFinderFactory(preFetchedResults, ['title'])
					deferred.notify({
						event: 'prefetch',
						data: key ? fuzzyFinder.search(key) : preFetchedResults
					});
					self.status.isLoading = true;
					DataProvider.resource.Job.findAll()
						.then(function (res) {
							fuzzyFinder = AppCoreUtilityServices.fuzzyFinderFactory(res, ['title']);
							var filteredResult = key ? fuzzyFinder.search(key) : res;
							deferred.resolve(DataProvider.resource.Job.filter({
								where: {
									adminId: Session.userId,
									id: {
										in: _.pluck(filteredResult, 'id')
									}
								}
							}));
							self.status.isLoading = false;
						}).catch(function (err) {
						console.log(err);
						deferred.reject(err);
						self.status.isLoading = false;
					});
					return deferred.promise;
				}
			}
		}

		function submitUpdateJobReq(jobData) {
			var deferred = $q.defer();

			/*DataProvider.resource.Job.update(jobData.id, {
			 title: jobData.jobName,
			 desc: jobData.jobDesc,
			 id: jobData.id

			 })*/
			DataProvider.resource.Job.update(jobData.id, {
				orgId: jobData.orgId,
				id: jobData.id,
				title: jobData.title,
				desc: jobData.desc,
				endtimeType:jobData.endtimeType,
				endTimeValue : jobData.endTimeValue,
				expectedFinishDate: jobData.expectedFinishDate,
				objective: jobData.objective
			}).then(function (res) {
					deferred.resolve(res);
				}, null, function (rawResponse) {

					deferred.notify(rawResponse);

				})
				.catch(function (error) {

					deferred.reject(error);

				}).finally(function () {
			});

			return deferred.promise;
		}

		function submitCreateJobReq(jobData) {
			var deferred = $q.defer();

			DataProvider.resource.Job.createJobUsingTemplate(jobData)
				.then(function (res) {
					console.log(res);
					deferred.resolve(res);
				})
				.catch(function (error) {

					deferred.reject(error);

				}).finally(function () {
			});

			return deferred.promise;
		}

		function sumbitTimesheetReq(job) {
			var dialogOptions = {
				templateUrl: 'app/modules/job/job-list/job-timesheet.dialog.tpl.html',
				controller: ['$scope', '$mdDialog', 'Lang',
					JobTimesheetController
				]
			};
			return Dialog.show(dialogOptions);

			function JobTimesheetController($scope, $mdDialog, Lang) {

				$scope.job = job;

				$scope.formModel = {
					create_timesheet: {
						hrs: ''
					}
				};
				$scope.cancel = $mdDialog.cancel;
				$scope.submitTime = submitTime;
				function submitTime() {
					var hrs = $scope.formModel.create_timesheet.hrs;
					job.submitJobTime(hrs).then(function (res) {
							$mdDialog.hide(res);
						}
					);
				}
			}
		}

	}
})();
