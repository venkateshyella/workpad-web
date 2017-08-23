/**
 * Created by sudhir on 28/10/15.
 */

(function () {
	"use strict";
	var DL = angular.module("DL");

	DL.service('ORGANISATION', [
		'$q',
		'Session', 'CATEGORY_TYPE', 'Connect', 'URL','$timeout','blockUI',
		function ($q, Session, CATEGORY_TYPE, Connect, URL,$timeout,blockUI) {

			var
				ACTIONS = {
					EDIT: 0,
					DELETE_ORG: 1,
					VAULT_ADD_FILE: 10,
					VAULT_REMOVE_FILE: 11,
					VAULT_RENAME_FILE: 12,
					VAULT_COPY_FILE: 13,
					VAULT_DOWNLOAD_FILE: 14,
					INVITE_TO_JOIN: 20,
					INVITE_PEOPLE: 120,
					CREATE_GROUP: 30,
					CREATE_JOB: 40,
					VIEW_JOB: 50
				}
				, ROLES = {
					ADMIN: 1,
					MEMBER: 2,
					VISITOR: 10
				}
			/**
			 * List of roles that authorize the action
			 */
				, ACTION_AUTHORIZATION_ROLE = {
					EDIT: [ROLES.ADMIN],
					DELETE_ORG: [ROLES.ADMIN],
					CREATE_GROUP: [ROLES.ADMIN, ROLES.MEMBER],
					CREATE_JOB: [ROLES.ADMIN, ROLES.MEMBER],
					CREATE_EVENT: [ROLES.ADMIN, ROLES.MEMBER],
					INVITE_TO_JOIN: [ROLES.ADMIN],
					INVITE_PEOPLE: [ROLES.ADMIN],
					VAULT_ADD_FILE: [ROLES.ADMIN, ROLES.MEMBER],
					VAULT_REMOVE_FILE: [ROLES.ADMIN, ROLES.MEMBER],
					VAULT_RENAME_FILE: [ROLES.ADMIN, ROLES.MEMBER],
					VAULT_COPY_FILE: [ROLES.ADMIN, ROLES.MEMBER],
					VAULT_DOWNLOAD_FILE: [ROLES.ADMIN, ROLES.MEMBER],
					VIEW_JOB: [ROLES.ADMIN, ROLES.MEMBER]
				}
				, meta = {
					JSON_filter: {
						default: ['id', 'adminId', 'orgName', 'desc']
					},
					AUTHORIZED_ACTIONS: ACTION_AUTHORIZATION_ROLE
				}
				, resource = null
				, config = {
					name: "Organisation",
					meta: meta,
					ACTIONS: ACTIONS,
					defaultValues: {},
					relations: {
						hasMany: {
							Group: {
								localField: '$_groups',
								foreignKey: 'orgId'
							},
							User: [
								{
									localField: '$_members',
									get: function (Resource, relationDef, instance, origGetter) {
										var UserResource = Resource.getResource('User');

										for (var index in instance.members) {
											UserResource.inject(instance.members[index]);
										}
										;
										var memberIds = _.pluck(instance.members, 'id');

										return UserResource.filter({
											where: {
												id: {
													in: memberIds
												}
											}
										});
									}
								}
							],
							Job: [
								{
									localField: '$_jobs',
									get: function (Resource, relationDef, instance, origGetter) {
										var JobResource = Resource.getResource('Job');
										return JobResource.filter({
											where: {
												orgId: instance.id
											}
										})
									}
								},
								{
									localField: 'jobs',
									foreignKey: 'orgId'
								}
							],
							File: [
								{
									localField: '$_files',
									foreignKey: 'orgId'
								}
							]
						},
						hasOne: {
							User: {
								localField: '$_adminUser',
								localKey: 'adminId',
								get: function (Resource, relationDef, instance, origGetter) {
									var UserResource = Resource.getResource('User');
									var adminId = instance.adminId;
									if (!adminId) return null;
									// Trigger member list injection
									var prefetchedMembersInModel = instance.$_members;
									var userModelFromUserStore = UserResource.get(adminId);
									if (userModelFromUserStore) {
										return userModelFromUserStore;
									}
									return null;
								}
							}
						}
					},
					endpoint: "/org",
					computed: {
						_img_full_hash: ['id', function (id) {
							"use strict";
							return Math.random().toString(36).substring(7);
						}],
						_img_icon_hash: ['id', function (id) {
							"use strict";
							return Math.random().toString(36).substring(7);
						}],
						_img_full: ['id', '_img_full_hash', function (id, _img_full_hash) {
							return URL.GET_PIC
								+ "?userSessionId=" + Session.id
								+ "&entityId=" + id
								+ "&imgEntityType=" + "ORG"
								+ "&imgType=" + "FULL"
								+ "&hash=" + _img_full_hash;
						}],
						_img_icon: [
							'id', '_img_icon_hash',
							function (id, _img_icon_hash) {
								return URL.GET_PIC
									+ "?userSessionId=" + Session.id
									+ "&entityId=" + id
									+ "&imgEntityType=" + "ORG"
									+ "&imgType=" + "ICON"
									+ "&hash=" + _img_icon_hash;
							}
						],
						_createdAt: ['createTime', function (createTime) {
							return new Date(createTime);
						}]
					},
					methods: {
						isActionAuthorized: function (actionName) {
							if (typeof ACTIONS[actionName] != 'undefined'
								&& ACTION_AUTHORIZATION_ROLE[actionName]) {
								var userRole = this.role
									, authorizedRoles = ACTION_AUTHORIZATION_ROLE[actionName]
									;
								if (authorizedRoles.indexOf(userRole) != -1) {
									return true;
								}
							}
							return false;
						},
						toJSON: function (options) {
							var _options = options || {}
								, self = this
								, filter = _options.filter || resource.meta.JSON_filter.default
								;
							return _.pick(self, filter);
						},
						refreshImageHash: function () {
							this._img_full_hash = Math.random().toString(36).substring(7);
							this._img_icon_hash = Math.random().toString(36).substring(7);

							this._img_icon = this.avatar = URL.GET_PIC
								+ "?userSessionId=" + Session.id
								+ "&entityId=" + this.id
								+ "&imgEntityType=" + "ORG"
								+ "&imgType=" + "ICON"
								+ "&hash=" + this._img_icon_hash;

							this._img_full = URL.GET_PIC
								+ "?userSessionId=" + Session.id
								+ "&entityId=" + this.id
								+ "&imgEntityType=" + "ORG"
								+ "&imgType=" + "FULL"
								+ "&hash=" + this._img_full_hash;

							$timeout(function () {
								this.blockUI.stop();
								}, 6000);
							
							return true;
						},
						loadGroups: function (params, options) {
							"use strict";
							var GroupResource = resource.getResource('Group')
								, _options = options || {}
								, _params = {}
								, self = this
								, orgId = self.id
								;

							_.extend(_params, params, {
								orgId: orgId
							});

							if (_options.bypassCache === true) {
								self._groupMemberIDs = []
							}

							return GroupResource.findAll(_params, {
									bypassCache: true
								}, _options)
								.then(function (groups) {
									_.forEach(groups, function (group) {
										GroupResource.inject({
											id: group.id,
											orgId: self.id
										})
									});
									return groups;
								})
								;
						},
						loadMembers: function (params, options) {
							var self = this
								, _options = options || {}
								, UserResource = resource.getResource('User')
								, _params = {}
								;
							_.extend(_params, params, {
								orgId: self.id
							});
							return UserResource.findAll(_params, {
									url: URL.ORG_MEMBERS,
									bypassCache: true
								}, _options)
								.then(function (orgMembers) {
									var orgMemberIds = _.pluck(orgMembers, 'id');
									if (_options.bypassCache) {
										self._groupMemberIDs = [];
									}
									self._groupMemberIDs = self._groupMemberIDs || [];
									self._groupMemberIDs = _.uniq(self._groupMemberIDs.concat(orgMemberIds));
									return orgMembers;
								})
						},
						loadJobs: function (params, options) {
							var self = this
								, _params = {}
								, orgId = self.id
								, deferred = $q.defer()
								;

							angular.extend(_params, params);
							_params.orgId = orgId;

							var JobResource = resource.getResource('Job');
							JobResource.findAll(_params, {
									bypassCache: true,
									url: URL.ORG_JOBS
								})
								.then(function (jobs) {
									/*deferred.resolve(JobResource.filter({
									 where: {
									 orgId: orgId
									 }
									 }))*/
									deferred.resolve(jobs);
								}, null, function (noti) {
									if (noti && noti.resp && noti.resp.paginationMetaData) {
										self.$_activityStore_loadJobs = noti.resp;
									}
									deferred.notify(noti)
								})
								.catch(function (err) {
									deferred.reject(err);
								});
							return deferred.promise;
						},
						loadFiles: function (params, options) {
							var orgId = this.id;
							var _params = angular.extend({}, params, {
								orgId: orgId
							});
							var _options = angular.extend({}, options, {
								url: URL.ORG_VAULT_FILE_LIST,
								bypassCache: true
							});
							var FileResource = resource.getResource('File');
							return FileResource.findAll(_params, _options)
								.then(function (files) {
									_.each(files, function (file) {
										file.orgId = orgId
									});
									return files;
								});
						},
						deleteFiles: function (fileList, options) {
							var deferred = $q.defer();
							var orgId = this.id;
							var FileResource = resource.getResource('File');
							var destroyReqParams = {
								catType: CATEGORY_TYPE.ORG,
								catId: orgId,
								files: _.map(fileList, function (file) {
									return {
										"id": file.id
									}
								})
							};
							FileResource.destroyAll({
									where: {
										id: {
											'in': _.pluck(fileList, 'id')
										}
									}
								}, {
									url: URL.VAULT_FILE_DELETE,
									params: destroyReqParams
								})
								.then(function (resp) {
									deferred.resolve(resp);
								}, null, function (rawResponse) {
									deferred.notify(rawResponse);
								})
								.catch(function (err) {
									deferred.reject(err);
								});
							return deferred.promise;
						},
						updateFiles: function (fileAttrArray, options) {
							var orgId = this.id
								, url = options.url;
							var FileResource = resource.getResource('File');
							var reqParams = {
								catType: CATEGORY_TYPE.ORG,
								catId: orgId,
								files: fileAttrArray
							};

							return FileResource.updateAll(reqParams, {
								url: url
							})
						},
						uploadIconImage: function (imageUri) {
							var deferred = $q.defer()
								, self = this;
							var uploadParams = {
								entityId: self.id,
								imgEntityType: "ORG",
								imgType: "ICON"
							};

							Connect.upload(
								URL.UPLOAD_FILE,
								imageUri,
								{
									params: uploadParams
								})
								.then(function onUploadSuccess(success) {
									  $timeout(function() {
										  self.refreshImageHash();
								      }, 1000)
									deferred.resolve(success);
								}, function onUploadError(error) {
									deferred.reject(error);
								});
							return deferred.promise;
						},
						fetchVaultFileCopyDestinations: function () {
							var deferred = $q.defer();
							var orgId = this.id;
							var params = {
								catType: CATEGORY_TYPE.ORG,
								catId: orgId
							};
							Connect.get(URL.VAULT_COPY_DESTINATION_LIST, params)
								.then(function (res) {
									deferred.resolve(res.resp);
								})
								.catch(function (err) {
									deferred.reject(err);
								})
							;

							return deferred.promise;
						},
						
						loadEvents: function (params, options) {
							var self = this
								, _params = {}
								, orgId = self.id
								, deferred = $q.defer()
								;

							angular.extend(_params, params);
							_params.catId = orgId;
							/**
							 * catType is 1 for organization
							 */
							_params.catType = 1; 

							var EventResource = resource.getResource('Event');
							EventResource.findAll(_params, {
									bypassCache: true,
									url: URL.ORG_EVENTS
								})
								.then(function (events) {
									deferred.resolve(events);
								}, null, function (noti) {
									if (noti && noti.resp && noti.resp.paginationMetaData) {
										self.$_activityStore_loadEvents = noti.resp;
									}
									deferred.notify(noti)
								})
								.catch(function (err) {
									deferred.reject(err);
								});
							return deferred.promise;
						},
						loadJobTemplates: function (params, options) {
							var self = this
								, _params = {}
								, orgId = self.id
								, deferred = $q.defer()
								;

							angular.extend(_params, params);
							
							_params.orgId = orgId;
							
							var JobTemplateResource = resource.getResource('JobTemplate');
							JobTemplateResource.findAll(_params, {
									bypassCache: true,
									url: URL.JOB_TEMPLATE_LIST
								})
								.then(function (templates) {
									deferred.resolve(templates);
								}, null, function (noti) {
									if (noti && noti.resp && noti.resp.paginationMetaData) {
										self.$_activityStore_loadTemplates = noti.resp;
									}
									deferred.notify(noti)
								})
								.catch(function (err) {
									deferred.reject(err);
								});
							return deferred.promise;
						},
						loadMeetings: function (params, options) {
							var self = this
								, _params = {}
								, orgId = self.id
								, deferred = $q.defer()
								;

							angular.extend(_params, params);
							
							_params.orgId = orgId;
							
							var MeetingResource = resource.getResource('Event');
							MeetingResource.findAll(_params, {
									bypassCache: true
								})
								.then(function (templates) {
									deferred.resolve(templates);
								}, null, function (noti) {
									if (noti && noti.resp && noti.resp.paginationMetaData) {
										self.$_activityStore_loadTemplates = noti.resp;
									}
									deferred.notify(noti)
								})
								.catch(function (err) {
									deferred.reject(err);
								});
							return deferred.promise;
						}

					
					},
					reqAdapter: {
						defaultAdapter: function (req) {
							return req;
						},
						update: function (req) {
							return {
								orgName: req.orgName,
								desc: req.desc,
								adminId: req.adminId,
								id: req.id
							};
						}
					},
					respAdapter: {
						defaultAdapter: function (resp) {
							return resp;
						},
						find: function (resp, id, options) {
							var orgId = id
								;
							/*
							 Manually add references for parent organisation in the group objects
							 */
							angular.forEach(resp.groups, function (groupJSON) {
								groupJSON.orgId = orgId;
								groupJSON.id = groupJSON.groupId;
								delete(groupJSON.groupId);
							});
							return resp;
						},
						findAll: function (resp) {
							"use strict";
							var resultsArray = resp.results;
							if (angular.isArray(resultsArray)) {

								/* Manually inject org-group relation attribute in group obj */
								_.each(resultsArray, function (org) {
									var orgId = org.id;
									if (angular.isArray(org.groups)) {
										_.each(org.groups, function (group) {
											/* Missing 'id' attribute in response */
											group.id = group.groupId;
											delete(group.groupId);
											/*  */
											group.orgId = orgId;
										})
									}
								});
								return resultsArray;
							} else {
								console.error("WorkSpace 'findAll' parse error");
								return [];
							}
						},
						create: function (resp) {
							"use strict";
							var org = resp.organizationEntity;
							angular.extend(resp, org);
							return resp;
						},
						update: function (resp) {
							var org = resp.organizationEntity;
							angular.extend(resp, org);
							return resp;
						}
					},
					 getOwnedOrgList : function(params) {
			        	  var _deferred = $q.defer()
			        	  Connect.get(URL.OWNED_ORG_LIST, params)
			        	  .then(function (res) {
			        		  
			        		  _.each(res.resp.results, function (org) {
									var orgId = org.id;
									var _img_icon_hash = Math.random().toString(36).substring(7);

									org._img_icon = URL.GET_PIC
										+ "?userSessionId=" + Session.id
										+ "&entityId=" + orgId
										+ "&imgEntityType=" + "ORG"
										+ "&imgType=" + "ICON"
										+ "&hash=" + _img_icon_hash;
									
								});
			        		  
			        		  
			        		  _deferred.resolve(res.resp);
			        	  })
			        	  .catch(function (err) {
			        		  _deferred.reject(err);
			        	  });

			        	  return _deferred.promise;
			          }
					
				};
			return {
				config: config,
				initResource: function (OrgResource) {
					resource = OrgResource;
				}
			}
		}
	])
})();