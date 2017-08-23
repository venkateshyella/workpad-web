/**
 * Created by sudhir on 27/5/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.service('OrganisationService', OrganisationService);

	function OrganisationService($q, $timeout, Session, DataProvider, AUDIT, URL, EVENT) {

		function submitCreateOrgReq(orgData) {
			var deferred = $q.defer();

			DataProvider.resource.Organisation.create({
					orgName: orgData.orgName,
					desc: orgData.orgDesc,
					adminId: Session.userId
				})
				.then(function (res) {
					deferred.resolve(res);
				}, function (error) {
					deferred.reject(error)
				});

			return deferred.promise;
		}

		function submitUpdateOrgReq(orgId, updatedOrgModel) {
			var deferred = $q.defer();
			var result = {
				data: null,
				msg: null
			};

			DataProvider.resource.Organisation.update(orgId, updatedOrgModel)
				.then(function (res) {
					result.data = res;
					deferred.resolve(result);
				}, null, function (rawResponse) {
					result.msg = rawResponse.respMsg
				}) // 3 arguements for then block success,error and notify
				.catch(function (error) {

					deferred.reject(error);

				}).finally(function () {
			});

			return deferred.promise;
		}

		function createAuditListCollectionLoader(orgId, auditListArray) {
			DataProvider.resource.Audit.createCollection(auditListArray, {
				catType: 1,
				catId: orgId
			});
			return DataProvider.PaginatedListLoaderFactory(
				auditListArray, 'fetch', {
					catType: 1,
					catId: orgId
				}, 25, {
					apiParams: {bypassCache: true}
				})
		}

		function createOrgJobAuditListLoader(orgId, auditListArray) {
			var auditPageLoader = AUDIT.AuditPageFactory(auditListArray, URL.ORG_JOBS_AUDIT, {
				orgId: orgId
			});
			return auditPageLoader;
		}
		
		
		function createOrgEventAuditListLoader(orgId, auditListArray) {
			var auditPageLoader = AUDIT.AuditPageFactory(auditListArray, URL.ORG_EVENTS_AUDIT, {
				catId: orgId,
				catType: 1
			});
			return auditPageLoader;
		}
		
		function createOrgTemplatesAuditListLoader(orgId, auditListArray) {
			var auditPageLoader = AUDIT.AuditPageFactory(auditListArray, URL.JOB_TEMPLATE_AUDIT, {
				catId: orgId,
				catType: 1
			});
			return auditPageLoader;
		}
		
		function createOrgMeetingsAuditListLoader(orgId, auditListArray) {
			var auditPageLoader = AUDIT.AuditPageFactory(auditListArray, URL.MEETING_AUDIT, {
				catId: orgId,
				catType: 1
			});
			return auditPageLoader;
		}
		
		function createOrgVaultAuditListLoader(orgId, auditListArray) {
			/*
			 For Organization catType = 1;
			 For Group catType = 2;
			 For Job catType = 3;
			 For Task catType = 4;
			*/


			var auditPageLoader = AUDIT.AuditPageFactory(auditListArray, URL.ORG_VAULT_AUDIT_LIST, {
				catId: orgId,
				catType: 1
			});
			return auditPageLoader;
		}

		return {
			submitUpdateOrgReq: submitUpdateOrgReq,
			submitCreateOrgReq: submitCreateOrgReq,
			createAuditListCollectionLoader: createAuditListCollectionLoader,
			createOrgJobAuditListLoader: createOrgJobAuditListLoader,
			createOrgVaultAuditListLoader: createOrgVaultAuditListLoader,
			createOrgEventAuditListLoader: createOrgEventAuditListLoader,
			createOrgTemplatesAuditListLoader : createOrgTemplatesAuditListLoader,
			createOrgMeetingsAuditListLoader : createOrgMeetingsAuditListLoader
		}
	}

	OrganisationService.$inject = ['$q', '$timeout', 'Session', 'DataProvider', 'AUDIT', 'URL', 'EVENT']

})();