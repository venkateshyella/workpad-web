/**
 * Created by sudhir on 27/5/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.service('GroupService', GroupService);

	function GroupService($q, $timeout, Session, DataProvider, AUDIT, URL) {

		function submitCreateGroupReq(groupModel, orgModel, parentGroup) {
			var deferred = $q.defer();

			var parentData = parentGroup.parentGroup || null;

			var createGroupRequestObj = {
				groupName: groupModel.groupModel.name,
				desc: groupModel.groupModel.desc,
				orgId: orgModel.orgModel.id
			};

			if (parentData) {
				createGroupRequestObj.groupParentId = parentData.id;
			}

			Connect.post(URL.CREATE_GROUP, createGroupRequestObj)
				//DataProvider.resource.Group.create({
				//  groupData: groupData,
				//  orgData: orgData,
				//  parentData: parentData
				//})
				.then(function (res) {
					console.log(res);
					deferred.resolve(res);
				}).catch(function (error) {
				deferred.reject(error)
			});
			return deferred.promise;
		}

		function submitUpdateGroupReq(groupId, updatedGroupModel) {
			var deferred = $q.defer();
			var result = {
				data: null,
				msg: null
			};

			DataProvider.resource.Group.update(groupId, updatedGroupModel)
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

		function createAuditListCollectionLoader(groupId, auditListArray) {
			DataProvider.resource.Audit.createCollection(auditListArray, {
				catType: 2,
				catId: groupId
			});
			return DataProvider.PaginatedListLoaderFactory(
				auditListArray, 'fetch', {
					catType: 2,
					catId: groupId
				}, 25, {
					apiParams: {bypassCache: true}
				})
		}

		function createGroupJobAuditListLoader(groupId, auditListArray) {
			var auditPageLoader = AUDIT.AuditPageFactory(auditListArray, URL.GROUP_JOBS_AUDIT, {
				groupId: groupId,
//				catType: 2
			});
			return auditPageLoader;
		}

		function createGroupVaultAuditListLoader(groupId, auditListArray) {
			/*
			 For Organization catType = 1;
			 For Group catType = 2;
			 For Job catType = 3;
			 For Task catType = 4;
			 */
			var auditPageLoader = AUDIT.AuditPageFactory(auditListArray, URL.VAULT_AUDIT_LIST, {
				catId: groupId,
				catType: 2
			});
			return auditPageLoader;
		}
		
		function createGroupEventAuditListLoader(groupId, auditListArray) {
			var auditPageLoader = AUDIT.AuditPageFactory(auditListArray, URL.ORG_EVENTS_AUDIT, {
				catId: groupId,
				catType: 2
			});
			return auditPageLoader;
		}
		
		function createGroupTemplateAuditListLoader(groupId, auditListArray) {
			var auditPageLoader = AUDIT.AuditPageFactory(auditListArray, URL.JOB_TEMPLATE_AUDIT, {
				catId: groupId,
				catType: 2
			});
			return auditPageLoader;
		}

		function creategroupMeetingsAuditListLoader(groupId, auditListArray) {
			var auditPageLoader = AUDIT.AuditPageFactory(auditListArray, URL.MEETING_AUDIT, {
				catId: groupId,
				catType: 2
			});
			return auditPageLoader;
		}
		
		return {
			submitUpdateGroupReq: submitUpdateGroupReq,
			submitCreateGroupReq: submitCreateGroupReq,
			createAuditListCollectionLoader: createAuditListCollectionLoader,
			createGroupJobAuditListLoader: createGroupJobAuditListLoader,
			createGroupVaultAuditListLoader: createGroupVaultAuditListLoader,
			createGroupEventAuditListLoader : createGroupEventAuditListLoader,
			createGroupTemplateAuditListLoader : createGroupTemplateAuditListLoader,
			creategroupMeetingsAuditListLoader : creategroupMeetingsAuditListLoader
		}
	}

	GroupService.$inject = ['$q', '$timeout', 'Session', 'DataProvider', 'AUDIT', 'URL']

})();
