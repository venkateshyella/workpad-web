/**
 * Created by sudhir on 27/5/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.service('TaskService', TaskService);

	function TaskService($q, $timeout, Session, DataProvider, AUDIT, URL) {

		function submitUpdateTaskReq(taskData) {
			var deferred = $q.defer();

			DataProvider.resource.Task.update(taskData.id, {
					title: taskData.taskName,
					desc: taskData.taskDesc,
					id: taskData.id

				})
				.then(function (res) {
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

		function submitCreateTaskReq(taskData) {
			var deferred = $q.defer();

			DataProvider.resource.Task.create({
					jobId: taskData.jobId,
					title: taskData.taskTitle,
					desc: taskData.taskDesc,
					order: 0,
					objective: taskData.taskObj
				})
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

		function createJobTaskListLoader(jobId) {
			return DataProvider.PaginatedListLoaderFactory(
				DataProvider.resource.Task, 'findAll', {
					jobId: jobId
				}, 25, {
					apiParams: {bypassCache: true}
				})
		}

		function createTaskVaultAuditListLoader(taskId, auditListArray) {
			/*
			 For Organization catType = 1;
			 For Group catType = 2;
			 For Job catType = 3;
			 For Task catType = 4;
			 */

			var auditPageLoader = AUDIT.AuditPageFactory(auditListArray, URL.JOB_VAULT_AUDIT_LIST, {
				catId: taskId,
				catType: 4
			});
			return auditPageLoader;
		}
		
		function createTalkVaultAuditListLoader(taskId, auditListArray) {
			var auditPageLoader = AUDIT.AuditPageFactory(auditListArray, URL.MEETING_AUDIT, {
				catId: taskId,
				catType: 4
			});
			return auditPageLoader;
		}

    function createTaskAuditListLoader(taskId, auditListArray) {
      
      var auditPageLoader = AUDIT.AuditPageFactory(auditListArray, URL.AUDIT_LIST, {
        catId: taskId,
        catType: 4
      });
      return auditPageLoader;
    }

		return {
			submitUpdateTaskReq: submitUpdateTaskReq,
			submitCreateTaskReq: submitCreateTaskReq,
			createJobTaskListLoader: createJobTaskListLoader,
      createTaskAuditListLoader: createTaskAuditListLoader,
			createTaskVaultAuditListLoader: createTaskVaultAuditListLoader,
			createTalkVaultAuditListLoader : createTalkVaultAuditListLoader
		}
	}

	TaskService.$inject = ['$q', '$timeout', 'Session', 'DataProvider', 'AUDIT', 'URL']

})();
