/**
 * Created by sudhir on 15/9/15.
 */


;
(function () {
	"use strict";

	angular.module('app')
		.service('JobTemplateMemberSearch', [
			'$q', '$timeout', 'DataProvider',
			'Connect', 'URL', 'Lang',
			JobTemplateMemberSearch
		])
		.factory('JobTemplateMemberSearchFactory', [JobTemplateMemberSearchFactory])
	;

	function JobTemplateMemberSearch($q, $timeout, DataProvider, Connect, URL, Lang) {

		JobAdvertisement.prototype.sendAdvertisement = function (jobId, invitationMessage,inviteType) {
			var deferred = $q.defer()
				, advData = this.getSavedData()
				, advRequest = {}
				;
			advRequest.jobId = jobId;
			advRequest.orgId = this.job.organization.id;
			advRequest.invitations = [];

			/* Individual user invitation */
			/*if (advData.users.length > 0) {
			 advRequest.invitations.push({
			 users: advData.users
			 })
			 }*/

			/* Group invitations */
			angular.forEach(advData.groups, function (value, groupId) {
				if (value.sendToAll === true) {
					advRequest.invitations.push({
						groupId: groupId,
						sendToAll: true
					});
				} else if (angular.isArray(value.invitee) && value.invitee.length > 0) {
					advRequest.invitations.push({
						groupId: groupId,
						users: value.invitee
					});
				}
			});

			/* Org invitations */
			/* Pick the org id of the job. */
			var jobOrgId = this.job.organization.id;
			var advOrg = advData.orgs[jobOrgId];
			if(advOrg){
				if (advOrg.sendToAll == true) {
				advRequest.invitations.push({
					sendToAll: true
				})
			} else if (angular.isArray(advOrg.invitee) && advOrg.invitee.length > 0) {
				advRequest.invitations.push({
					sendToAll: false,
					users: advOrg.invitee
				})
			}
			}
			

			invitationMessage && (advRequest.reason = invitationMessage);
			
			var _url;

			if(inviteType == "DELEGATE"){
          _url = URL.JOB_INIVITE_CONTRIBUTOR
			}
			else {
          _url = URL.JOB_ADVERTISE
			}

			$timeout(function () {
				Connect.post(_url, advRequest)
					.then(function (res) {
						deferred.resolve(res);
					})
					.catch(function (err) {
						deferred.reject(err)
					})
				;
			}, 500);

			return deferred.promise;
		};

		/**
		 * Helper service for fetching groups to which
		 * the job can be advertised.
		 *
		 * Invitations can then be sent to these group members.
		 * @param options
		 * @returns Promise
		 */
		JobAdvertisement.prototype.queryAdvertisementInvitees = function (opts) {
			var options = opts || {}
				, deferred = $q.defer()
				, jobId = this.job.id
				, orgId = this.job.organization.id
				, queryType = opts.queryType
				, searchQuery = options.queryStr || null
				, queryUrl = null
				, inviteType = opts.inviteType || "OWNER"
				;

			queryType = queryType || 'ADV_GROUP';
			queryUrl = (queryType == 'ADV_GROUP')
				? URL.JOB_INV_ORG_AND_GROUP_SEARCH
				: URL.JOB_INV_MEMBER_SEARCH;


			Connect.get(queryUrl, {
					orgId: orgId,
					jobId: jobId,
					inviteType: inviteType,
					searchByName: searchQuery
				})
				.then(function (res) {
					if (res.isSuccess) {
						prepareSearchResults(res.resp);
						deferred.resolve(res.resp);
					}
					else {
						deferred.reject(res)
					}
				})
				.catch(function (err) {
					deferred.reject(err);
				})
				.finally(function () {
				})
			;
			return deferred.promise;
		};

		/**
		 * Helper service to fetch the list of members in a group
		 * that have not been invited to this own this job.
		 *
		 * @param options
		 * @returns Promise
		 */
		JobAdvertisement.prototype.getAdvGroupMembers = function (groupId, options) {
			var deferred = $q.defer();

			var inviteType = options.inviteType || "OWNER";
			Connect.get(URL.JOB_INV_GROUP_MEMBER_LIST, {
					groupId: groupId,
					jobId: this.job.id,
					inviteType: inviteType
				})
				.then(function (res) {
					if (res.isSuccess) {
						deferred.resolve(res.resp);
					}
					else {
						deferred.reject(res)
					}
					return res.resp;
				})
				.catch(function (err) {
					return err
				})
			;
			return deferred.promise;
		};

		JobAdvertisement.prototype.getAdvOrgMembers = function (orgId, options) {
			var deferred = $q.defer();

			var inviteType = options.inviteType || "OWNER";
			Connect.get(URL.JOB_INV_MEMBER_SEARCH, {
					orgId: orgId,
					jobId: this.job.id,
					inviteType: inviteType,
					searchByName: null
				})
				.then(function (res) {
					if (res.isSuccess) {
						deferred.resolve(res.resp);
					}
					else {
						deferred.reject(res)
					}
					return res.resp;
				})
				.catch(function (err) {
					return err
				})
			;
			return deferred.promise;
		};

		return JobAdvertisement;

		function prepareSearchResults(searchRes) {
			var groups = searchRes.groups;
			var orgs = searchRes.orgs;
			var users = searchRes.user;

			/* inject groups */
			_.forEach(groups, function (group) {
				group.id = group.groupId
			});
			groups && DataProvider.resource.Group.inject(groups);

			/* inject orgs */
			_.forEach(orgs, function (org) {
				org.id = org.orgId
			});
			orgs && DataProvider.resource.Organisation.inject(orgs);

			/* inject users */
			users && DataProvider.resource.User.inject(users);
		}

		function fetchJobAdvGroups(jobId, groupId) {
		}
	}

	function JobTemplateMemberSearchFactory() {
		return {
			JobTemplateMemebers: JobAdvertisement
		}
	}


	/**
	 * Advertisement class
	 */

	function JobAdvertisement(job) {
		var targetAudience = {
			users: [],
			orgs: {},
			groups: {}
		};

		this.job = job;
		this.getSavedData = getSavedData;
		this.getInvitationGroups = getInvitationGroups;
		this.getInvitationOrgs = getInvitationOrgs;
		this.getInvitationMembers = getInvitationMembers;
		this.isValid = isValid;

		this.addOrg = addOrg;
		this.getOrg = getOrg;
		this.removeOrg = removeOrg;
		this.setOrgSendToAll = setOrgSendToAll;
		this.getOrgSendToAll = getOrgSendToAll;
		this.getOrgExtras = getOrgExtras;
		this.setOrgExtras = setOrgExtras;
		this.getOrgMember = getOrgMember;
		this.addOrgMember = addOrgMember;
		this.removeOrgMember = removeOrgMember;
		this.removeAllOrgMembers = removeAllOrgMembers;
		this.addAllOrgMembers = addAllOrgMembers;

		this.addMember = addMember;
		this.removeMember = removeMember;

		this.addGroup = addGroup;
		this.getGroup = getGroup;
		this.removeGroup = removeGroup;
		this.setGroupSendToAll = setGroupSendToAll;
		this.getGroupSendToAll = getGroupSendToAll;
		this.getGroupExtras = getGroupExtras;
		this.setGroupExtras = setGroupExtras;
		this.addGroupMember = addGroupMember;
		this.removeGroupMember = removeGroupMember;
		this.addSendToAllFlag = addSendToAllFlag;
		this.removeSendToAllFlag = removeSendToAllFlag;

		function getOrgExtras(orgId) {
			if (targetAudience.orgs[orgId]) {
				return targetAudience.orgs[orgId].xtras;
			}
		}

		function setOrgExtras(orgId, val) {
			if (targetAudience.orgs[orgId]) {
				targetAudience.orgs[orgId].xtras = targetAudience.orgs[orgId].xtras || {};
				angular.extend(targetAudience.orgs[orgId].xtras, val);
			}
		}

		function getInvitationOrgs() {
			return targetAudience.orgs;
		}

		function addOrg(orgId) {
			targetAudience.orgs[orgId] = targetAudience.orgs[orgId] || {};
		}

		function getOrg(orgId) {
			return targetAudience.orgs[orgId];
		}

		function getGroup(groupId) {
			return targetAudience.groups[groupId];
		}

		function removeOrg(orgId) {
			if (targetAudience.orgs[orgId]) {
				delete targetAudience.orgs[orgId];
			}
		}

		function getOrgSendToAll(orgId) {
			if (targetAudience.orgs[orgId]) {
				return !!targetAudience.orgs[orgId].sendToAll;
			}
			return false;
		}
		function getGroupSendToAll(groupId) {
			if (targetAudience.groups[groupId]) {
				return !!targetAudience.groups[groupId].sendToAll;
			}
			return false;
		}

		function setOrgSendToAll(orgId, sendToAll) {
			if (targetAudience.orgs[orgId]) {
				targetAudience.orgs[orgId].sendToAll = !!sendToAll;
			}
		}
		function setGroupSendToAll(groupId, sendToAll) {
			if (targetAudience.groups[groupId]) {
				targetAudience.groups[groupId].sendToAll = !!sendToAll;
			}
		}

		function addOrgMember(orgId, userId) {
			addOrg(orgId);
			targetAudience.orgs[orgId].invitee = targetAudience.orgs[orgId].invitee || [];
			if (targetAudience.orgs[orgId].invitee.indexOf(userId) == -1) {
				targetAudience.orgs[orgId].invitee.unshift(userId);
			}
		}

		function addAllOrgMembers(orgId, userIds) {
			addOrg(orgId);
			targetAudience.orgs[orgId].invitee = targetAudience.orgs[orgId].invitee || [];
			targetAudience.orgs[orgId].invitee = userIds;
		}

		function getOrgMember(orgId, userId) {
			if (targetAudience.orgs[orgId]
				&& targetAudience.orgs[orgId].invitee instanceof Array
				&& targetAudience.orgs[orgId].invitee.indexOf(userId) != -1) {
				return targetAudience.orgs[orgId].invitee[
					targetAudience.orgs[orgId].invitee.indexOf(userId)];
			}
		}

		function removeOrgMember(orgId, userId) {
			if (targetAudience.orgs[orgId]) {
				if (targetAudience.orgs[orgId].invitee instanceof Array) {
					if (targetAudience.orgs[orgId].invitee
						&& targetAudience.orgs[orgId].invitee.indexOf(userId) != -1) {
						targetAudience.orgs[orgId].invitee.splice(
							targetAudience.orgs[orgId].invitee.indexOf(userId), 1);
					}
				}
			}
		}

		function removeAllOrgMembers(orgId) {
			if (targetAudience.orgs[orgId]
				&& targetAudience.orgs[orgId].invitee instanceof Array
				&& targetAudience.orgs[orgId].invitee.length > 0) {
				targetAudience.orgs[orgId].invitee = [];
			}
		}

		function addMember(userId) {
			targetAudience.users = targetAudience.users || [];
			targetAudience.users.push(userId);
			targetAudience.users = _.uniq(targetAudience.users);
		}

		function removeMember(userId) {
			if (targetAudience.users) {
				_.remove(targetAudience.users, function (id) {
					return id == userId;
				});
			}
		}

		function getInvitationGroups() {
			return targetAudience.groups;
		}

		function getInvitationMembers() {
			return targetAudience.users;
		}

		function getSavedData() {
			return targetAudience;
		}

		function isValid() {
			// Check selected groups
			for (var groupId in targetAudience.groups) {
				if (targetAudience.groups[groupId].sendToAll == true
					|| (targetAudience.groups[groupId].invitee && targetAudience.groups[groupId].invitee.length > 0)) {
					return true;
				}
			}

			// Check selected orgs
			for (var orgId in targetAudience.orgs) {
				if (targetAudience.orgs[orgId].sendToAll == true
					|| (targetAudience.orgs[orgId].invitee && targetAudience.orgs[orgId].invitee.length > 0)) {
					return true;
				}
			}
			// Check users array length
			return targetAudience.users.length > 0;
		}

		function addSendToAllFlag(groupId) {
			console.log('adding send to all:' + groupId);
			targetAudience.groups[groupId].sendToAll = true;
		}

		function removeSendToAllFlag(groupId) {
			console.log('removing send to all:' + groupId);
			//if(!(targetAudience.groups[groupId] instanceof Array)) targetAudience.groups[groupId] = [];
			targetAudience.groups[groupId].sendToAll = false;
		}

		function addGroup(groupId, val) {
			targetAudience.groups[groupId] = targetAudience.groups[groupId] || {};
			targetAudience.groups[groupId].val = val;
			targetAudience.groups[groupId].invitee = targetAudience.groups[groupId].invitee || [];
		}

		function removeGroup(groupId) {
			if (targetAudience.groups[groupId]) {
				delete(targetAudience.groups[groupId])
			}
		}

		function getGroupExtras(groupId) {
			if (targetAudience.groups[groupId]) {
				return targetAudience.groups[groupId].xtras;
			}
		}

		function setGroupExtras(groupId, val) {
			if (targetAudience.groups[groupId]) {
				targetAudience.groups[groupId].xtras = targetAudience.groups[groupId].xtras || {};
				angular.extend(targetAudience.groups[groupId].xtras, val);
			}
		}

		function addGroupMember(groupId, memberId) {
			console.log('adding ' + memberId + ' to ' + groupId);
			addGroup(groupId);
			if (targetAudience.groups[groupId].invitee.indexOf(memberId) == -1) {
				targetAudience.groups[groupId].invitee.unshift(memberId);
			}
			console.log(targetAudience);
			return this;
		}

		function removeGroupMember(groupId, memberId) {
			console.log('removing ' + memberId + ' from ' + groupId);
			targetAudience.groups[groupId] = targetAudience.groups[groupId] || {};
			if (!(targetAudience.groups[groupId].invitee instanceof Array)) return;
			if (targetAudience.groups[groupId].invitee
				&& targetAudience.groups[groupId].invitee.indexOf(memberId) != -1) {
				targetAudience.groups[groupId].invitee.splice(
					targetAudience.groups[groupId].invitee.indexOf(memberId), 1);
			}
			//if(targetAudience[groupId].invitee.length = 0) addSendToAllFlag(groupId);
			console.log(targetAudience);
			return this;
		}
	}

	/**
	 * Return a JSON object formatted according to the service definition.
	 */
	JobAdvertisement.prototype.prepareAdvertisementRequestJSON = function () {
	}

})();