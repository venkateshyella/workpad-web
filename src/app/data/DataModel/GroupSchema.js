/**
 * Created by sudhir on 29/10/15.
 */

;
(function() {
    "use strict";
    var DL = angular.module("DL");
    DL.service('GROUP', [
        '$q', 'Session', 'CATEGORY_TYPE', 'Connect', 'URL',
        function($q, Session, CATEGORY_TYPE, Connect, URL) {

            var
                ACTIONS = {
                    EDIT: 10,
                    DELETE_GROUP: 11,
                    VAULT_ADD_FILE: 20,
                    VAULT_REMOVE_FILE: 21,
                    VAULT_RENAME_FILE: 22,
                    VAULT_COPY_FILE: 23,
                    INVITE_TO_JOIN: 30,
                    CREATE_SUB_GROUP: 40,
                    CREATE_JOB: 50
                },
                ROLES = {
                    ADMIN: 3,
                    MEMBER: 4,
                    VISITOR: 10
                }
                /**
                 * List of roles that authorize the action
                 */
                ,
                ACTION_AUTHORIZATION_ROLE = {
                    EDIT: [ROLES.ADMIN],
                    DELETE_GROUP: [ROLES.ADMIN],
                    CREATE_SUB_GROUP: [ROLES.ADMIN, ROLES.MEMBER],
                    INVITE_TO_JOIN: [ROLES.ADMIN],
                    VAULT_ADD_FILE: [ROLES.ADMIN, ROLES.MEMBER],
                    VAULT_REMOVE_FILE: [ROLES.ADMIN, ROLES.MEMBER],
                    VAULT_COPY_FILE: [ROLES.ADMIN, ROLES.MEMBER],
                    VAULT_RENAME_FILE: [ROLES.ADMIN, ROLES.MEMBER],
                    CREATE_JOB: [ROLES.ADMIN, ROLES.MEMBER]
                };
            var ROLE_REV_MAP = _.invert(ROLES);

            var resource = null,
                config = {
                    name: "Group",
                    relations: {
                        hasMany: {
                            Group: {
                                localField: '$_subGroups',
                                get: function(GroupResource, relationDef, instance, origGetter) {
                                    return GroupResource.filter({
                                        where: {
                                            groupParentId: instance.id
                                        }
                                    })
                                }
                            },
                            User: {
                                localField: '$_members',
                                get: function(GroupResource, relationDef, instance, origGetter) {
                                    var UserResource = GroupResource.getResource('User');

                                    return UserResource.filter({
                                        where: {
                                            id: { in : instance._groupMemberIDs
                                            }
                                        }
                                    });
                                }
                            },
                            File: {
                                localField: '$_files',
                                foreignKey: 'groupId'
                            }
                        },
                        hasOne: {
                            User: {
                                localField: '$_adminUser',
                                localKey: 'adminId',
                                get: function(Resource, relationDef, instance, origGetter) {
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
                    endpoint: "/org/group",
                    beforeInject: function(options, instance) {
                        if(instance.members) {
                            var UserResource = resource.getResource('User');
                            UserResource.inject(instance.members);
                            instance._groupMemberIDs = _.pluck(instance.members, 'id');
                        }
                    },
                    computed: {
                        _img_full_hash: ['id', function(id) {
                            "use strict";
                            return Math.random().toString(36).substring(7);
                        }],
                        _img_icon_hash: ['id', function(id) {
                            "use strict";
                            return Math.random().toString(36).substring(7);
                        }],
                        _img_full: ['id', function(id) {
                            return URL.GET_PIC + "?userSessionId=" + Session.id + "&entityId=" + id + "&imgEntityType=" + "GRP" + "&imgType=" + "FULL" + "&hash=" + this._img_icon_hash;
                        }],
                        _img_icon: ['id', function(id) {
                            return URL.GET_PIC + "?userSessionId=" + Session.id + "&entityId=" + id + "&imgEntityType=" + "GRP" + "&imgType=" + "ICON" + "&hash=" + this._img_icon_hash;
                        }],
                        _roleName: ['role', function(roleCode) {
                            return ROLE_REV_MAP[roleCode];
                        }]
                    },
                    customEndpoint: {
                        create: '/create.ws',
	                      destroy: '/delete.ws'
                    },
                    methods: {
                        amITheAdmin: function() {
                            return this.role == ROLES.ADMIN
                        },
                        amITheMember: function() {
                            return this.role == ROLES.MEMBER
                        },
                        isActionAuthorized: function(actionName) {
                            if (typeof ACTIONS[actionName] != 'undefined' && ACTION_AUTHORIZATION_ROLE[actionName]) {
                                var userRole = this.role,
                                    authorizedRoles = ACTION_AUTHORIZATION_ROLE[actionName];
                                if (authorizedRoles.indexOf(userRole) != -1) {
                                    return true;
                                }
                            }
                            return false;

                        },
                        refreshImageHash: function() {
                            this._img_full_hash = Math.random().toString(36).substring(7);
                            this._img_icon_hash = Math.random().toString(36).substring(7);

                            this._img_icon = this.avatar = URL.GET_PIC + "?userSessionId=" + Session.id + "&entityId=" + this.id + "&imgEntityType=" + "ORG" + "&imgType=" + "ICON" + "&hash=" + this._img_icon_hash;

                            this._img_full = URL.GET_PIC + "?userSessionId=" + Session.id + "&entityId=" + this.id + "&imgEntityType=" + "ORG" + "&imgType=" + "FULL" + "&hash=" + this._img_full_hash;

                            return true;
                        },
                        loadGroups: function loadGroups(params, options) {
                            var _options = options || {},
                                _params = {},
                                self = this,
                                orgId = self.orgId;

                            _.extend(_params, params, {
                                orgId: orgId,
                                userId: Session.userId,
                                groupParentId: self.id
                            });

                            if (_options.bypassCache === true) {
                                self._groupMemberIDs = []
                            }

                            return resource.findAll(_params, {
                                    bypassCache: true
                                })
                                .then(function(groups) {
                                    _.forEach(groups, function(group) {
                                        //resource.inject({
                                        //	id: group.id,
                                        //	orgId: self.id
                                        //})
                                    });
                                    return groups;
                                });
                        },
                        loadMembers: function(params, options) {
                            var self = this,
                                _options = options || {},
                                UserResource = resource.getResource('User'),
                                _params = {};
                            _.extend(_params, params, {
                                grpId: self.id
                            });
                            return UserResource.findAll(_params, {
                                    url: URL.GROUP_MEMBERS,
                                    bypassCache: true
                                }, _options)
                                .then(function(groupMembers) {
                                    var groupMemberIds = _.pluck(groupMembers, 'id');
                                    if (_options.bypassCache) {
                                        self._groupMemberIDs = [];
                                    }
                                    self._groupMemberIDs = self._groupMemberIDs || [];
                                    self._groupMemberIDs = _.uniq(self._groupMemberIDs.concat(groupMemberIds));
                                    return groupMembers;
                                })
                        },
                        loadJobs: function(params, options) {
                            var self = this,
                                _params = {},
                                orgId = self.orgId,
                                deferred = $q.defer();

                            angular.extend(_params, params);
                            _params.orgId = orgId;

                            var JobResource = resource.getResource('Job');
                            JobResource.findAll(_params, {
                                    bypassCache: true,
                                    url: URL.GROUP_JOBS
                                })
                                .then(function(jobs) {
                                    deferred.resolve(jobs);
                                }, null, function(noti) {
                                    if (noti && noti.resp && noti.resp.paginationMetaData) {
                                        self.$_activityStore_loadJobs = noti.resp;
                                    }
                                    deferred.notify(noti)
                                })
                                .catch(function(err) {
                                    deferred.reject(err);
                                });
                            return deferred.promise;
                        },

                        loadFiles: function(params, options) {
                            var groupId = this.id;
                            var _params = angular.extend({}, params, {
                                groupId: groupId
                            });
                            var _options = angular.extend({}, options, {
                                url: URL.GROUP_VAULT_FILE_LIST,
                                bypassCache: true
                            });
                            var FileResource = resource.getResource('File');
                            return FileResource.findAll(_params, _options)
                                .then(function(files) {
                                    _.each(files, function(file) {
                                        file.groupId = groupId
                                    });
                                    return files;
                                });
                        },
                        deleteFiles: function(fileList, options) {
                            var deferred = $q.defer();
                            var groupId = this.id;
                            var FileResource = resource.getResource('File');
                            var destroyReqParams = {
                                catType: 2,
                                catId: groupId,
                                files: _.map(fileList, function(file) {
                                    return { "id": file.id }
                                })
                            };
                            console.log(destroyReqParams);
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
                                },null,function(rawResponse){
                                    deferred.notify(rawResponse);
                                })
                                .catch(function (err) {
                                    deferred.reject(err);
                                });
                                return deferred.promise;
                        },
                        updateFiles: function(fileAttrArray, options) {
                            var groupId = this.id;
                            var FileResource = resource.getResource('File');
                            var reqParams = {
                                catType: 2,
                                catId: groupId,
                                files: fileAttrArray
                            };

                            return FileResource.updateAll(reqParams, {
                                url: URL.VAULT_FILE_RENAME
                            })
                        },
                        fetchVaultFileCopyDestinations: function() {
                            var deferred = $q.defer();
                            var groupId = this.id;
                            var params = {
                                catType: CATEGORY_TYPE.GROUP,
                                catId: groupId
                            };
                            Connect.get(URL.VAULT_COPY_DESTINATION_LIST, params)
                                .then(function(res) {
                                    deferred.resolve(res.resp);
                                })
                                .catch(function(err) {
                                    deferred.reject(err);
                                });

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
							_params.catType = 2; 

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
								, deferred = $q.defer()
								;

							angular.extend(_params, params);
							
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
								, deferred = $q.defer()
								;

							angular.extend(_params, params);
							
							var MeetingResource = resource.getResource('Meeting');
							MeetingResource.findAll(_params, {
									bypassCache: true,
									url: URL.MEETING_LIST
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
                        defaultAdapter: function(definition, attrs, options) {
                            "use strict";
                            return attrs;
                        },
                        create: function(definition, attrs, options) {
                            "use strict";
                            return {
                                groupName: attrs.groupData.name,
                                desc: attrs.groupData.desc,
                                orgId: attrs.orgData.id,
                                groupParentId: attrs.groupData ? attrs.groupData.id : 0
                            }
                        },
                        find: function(definition, id, options) {
                            "use strict";
                            if (options.params) {
                                return options.params;
                            } else {
                                return id;
                            }
                        },
                        update: function(req) {
                            return {
                                id: req.id,
                                orgId: req.orgId,
                                groupName: req.groupName,
                                desc: req.desc,
                                groupParentId: req.groupParentId,
                                adminId: req.adminId
                            };
                        }
                    },
                    respAdapter: {
                        defaultAdapter: function(resp, options) {
                            return resp;
                        },
                        create: function(resp, options) {
                            "use strict";
                            console.log(resp);
                            return resp;
                        },
                        find: function(resp, id, options) {
                            "use strict";
                            resp.orgId = options.params.orgId;
                            return resp;
                        },
                        findAll: function(respArray, options) {
                            "use strict";
                            for (var index in respArray.results) {
                                respArray.results[index].id = respArray.results[index].groupId;
                            }
                            return respArray.results;
                        }
                    }
                };

            return {
                config: config,
                initResource: function(newResource) {
                    resource = newResource;
                }
            }
        }
    ]);

})();
