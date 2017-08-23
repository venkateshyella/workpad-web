/**
 * Created by sudhir on 14/9/15.
 */


;
(function () {

	var DL = angular.module("DL");


	DL.service('TASK', ['$q', 'Connect', 'URL',
		'ROLE', 'TASK_LIFECYCLE_EVENT', 'Lang', 'CATEGORY_TYPE', 'Session',
		function TaskSchema($q, Connect, URL, ROLE, TASK_LIFECYCLE_EVENT, Lang, CATEGORY_TYPE, Session) {

			var meta = {};
			var LANG = Lang.en.data;
			var resource;

			var TASK_STATUS = {
				NEW: -101,
				OWNED: -102,
				IN_PROGRESS: -103,
				STOPPED: -104,
				FINISHED: -106,
				UNDER_VERIFICATION: -107,
				CANCELLED: -109,
				REJECTED: -108,
				CLOSED: -110,
				ASSIGNED: -202,

				CREATE: -301,
				START: -302,
				FINISH: -303,
				CLOSE: -304
			};

			var TASK_ROLES = {
				CREATOR: 7,
				ASSIGNEEE: 10,
				ORIGINATOR: 11,
				OWNER: 12,
				CONTRIBUTOR: 13
			};

			var ACTIONS = {
				EDIT: {
					STATUS: [TASK_STATUS.NEW],
					ROLES: [TASK_ROLES.CREATOR]
				},

				DELETE_TASK: {
					STATUS: [TASK_STATUS.NEW, TASK_STATUS.ASSIGNED],
					ROLES: [TASK_ROLES.CREATOR]
				},
				UN_ASSIGN: {
					STATUS: [TASK_STATUS.ASSIGNED],
					ROLES: [TASK_ROLES.CREATOR]
				}
			};

			return {
				config: {
					name: "Task",
					STATUS: TASK_STATUS,
					EVENT: TASK_LIFECYCLE_EVENT,
					relations: {
						hasOne: {
							creator: {
								localField: '$_creator',
								get: function (Resource, relationDef, instance, origGetter) {
									"use strict";
									var UserResource = resource.getResource('User');
									var creatorObj = instance.originator;
									if (!creatorObj) return null;
									var creatorUserModel = UserResource.get(creatorObj.id);

									if (creatorUserModel) {
										return creatorUserModel
									} else {
										UserResource.inject(creatorObj);
										return UserResource.get(creatorObj.id);
									}
								}
							},
							assignee: {
								localField: '$_owner',
								get: function (Resource, relationDef, instance, origGetter) {
									"use strict";
									var UserResource = resource.getResource('User');
									var ownerObj = instance.owner;
									if (!ownerObj) return null;
									var ownerUserModel = UserResource.get(ownerObj.id);

									if (ownerUserModel) {
										return ownerUserModel
									} else {
										UserResource.inject(ownerObj);
										return UserResource.get(ownerObj.id);
									}
								}
							}
						},
						belongsTo: {
							Job: {
								localField: 'job',
								localKey: 'jobId'
							}
						},
						hasMany: {
							Form: {
								localField: 'forms',
								foreignKey: 'taskId'
							}
						}
					},
					computed: {
						displayStatus: {
							enumerable: true,
							get: function () {
								switch (this.status) {
									case TASK_STATUS.NEW:
										return LANG.JOB.JOB_STATUS.NEW;
										break;

									case TASK_STATUS.CREATE:
										return LANG.JOB.JOB_STATUS.CREATE;
										break;

									case TASK_STATUS.START:
										return LANG.JOB.JOB_STATUS.START;
										break;

									case TASK_STATUS.FINISH:
										return LANG.JOB.JOB_STATUS.FINISH;
										break;

									case TASK_STATUS.CLOSE:
										return LANG.JOB.JOB_STATUS.CLOSE;
										break;


									case TASK_STATUS.ASSIGNED:
										return LANG.JOB.JOB_STATUS.ASSIGNED;
										break;

									case TASK_STATUS.OWNED:
										return LANG.JOB.JOB_STATUS.OWNED;
										break;

									case TASK_STATUS.IN_PROGRESS:
										return LANG.JOB.JOB_STATUS.IN_PROGRESS;
										break;

									case TASK_STATUS.STOPPED:
										return LANG.JOB.JOB_STATUS.STOPPED;
										break;

									case TASK_STATUS.FINISHED:
										return LANG.JOB.JOB_STATUS.FINISHED;
										break;

									case TASK_STATUS.UNDER_VERIFICATION:
										return LANG.JOB.JOB_STATUS.UNDER_VERIFICATION;
										break;

									case TASK_STATUS.CANCELLED:
										return LANG.JOB.JOB_STATUS.CANCELLED;
										break;

									case TASK_STATUS.CLOSED:
										return LANG.JOB.JOB_STATUS.CLOSED;
										break;

									default:
										return LANG.JOB.JOB_STATUS.DEFAULT
								}
							}
						},
						$_roles: {
							enumerable: true,
							get: function () {
								"use strict";
								var roles = [],
									assigneeId = this.$_owner && this.$_owner.id,
									creatorId = this.$_creator && this.$_creator.id;
								creatorId == Session.userId && roles.push(TASK_ROLES.CREATOR);
								assigneeId == Session.userId && roles.push(TASK_ROLES.ASSIGNEEE);
								return roles;
							}
						}
					},
					meta: {
						STATUS: TASK_STATUS,
						ROLES: TASK_ROLES,
						ACTIONS: ACTIONS
					},
					beforeInject: function (options, instance) {
						"use strict";
						var UserResource = resource.getResource('User');
						if (instance instanceof Array) {
							_.each(instance, function (taskInstance) {
								injectMembers(taskInstance, taskInstance.members);
							})
						} else {
							injectMembers(instance, instance.members)
						}

						instance.$_memberCollection = [];
						UserResource.createCollection(instance.$_memberCollection, {
							taskId: instance.id
						});

						// Task originator user inject
						if (instance.originator) {
							UserResource.inject(instance.originator);
						}

						// Task owner user inject
						if (instance.owner) {
							UserResource.inject(instance.owner);
						}

						function injectMembers(task, members) {
							if (members) {
								UserResource.inject(members);
							}
						}
					},
					methods: {
						isActionAllowed: function (actionName) {
							var action = ACTIONS[actionName];
							if (typeof action != 'undefined') {
								return _.intersection(this.$_roles, action.ROLES).length > 0 &&
									action.STATUS.indexOf(this.status) >= 0;
							}
							console.error("action %s is not a valid action", actionName);
							return false;
						},

						getTaskCreatedFullPath: function () {
							"use strict";
							var taskCreatedFullPathObj = this.createdFullPath;
							if (taskCreatedFullPathObj) {
								var fullPath = "";
								angular.forEach(taskCreatedFullPathObj, function (value, key) {
									if (fullPath.length > 0) {
										fullPath = fullPath + ' / ' + value.name;
									}
									else {
										fullPath = value.name
									}
								});
								return fullPath;
							}
							else {
								return '';
							}

						},

						getMeta: function () {
							return meta;
						},

						amITheAssignee: function () {
							"use strict";
							return this.owner && this.owner.id == Session.userId;
						},

						hasAssignee: function () {
							"use strict";
							return !!this.owner;
						},

						hasCreator: function () {
							"use strict";
							return !!this.$_creator;
						},

						amITheCreator: function () {
							"use strict";
							return this.$_creator && this.$_creator.id == Session.userId;
						},

						can: function () {
							var taskModel = this;
							return {
								removeOwner: function () {
									"use strict";
									return taskModel.amITheCreator();
								},
								removeContributor: function () {
									"use strict";
									return taskModel.amITheAssignee();
								}
							}
						},

						isNew: function () {
							"use strict";
							return this.status == TASK_STATUS.NEW;
						},

						isOwned: function () {
							"use strict";
							return this.status != TASK_STATUS.NEW;
						},

						isAssigned: function () {
							"use strict";
							return this.status == TASK_STATUS.ASSIGNED;
						},

						isNotStarted: function () {
							"use strict";
							return this.status == TASK_STATUS.OWNED ||
								this.status == TASK_STATUS.NEW || this.status == TASK_STATUS.ASSIGNED;
						},

						isInProgress: function () {
							"use strict";
							return this.status == TASK_STATUS.IN_PROGRESS
						},

						isStopped: function () {
							"use strict";
							return this.status == TASK_STATUS.STOPPED
						},

						isFinished: function () {
							"use strict";
							return this.status == TASK_STATUS.FINISHED || this.status == TASK_STATUS.UNDER_VERIFICATION || this.status == TASK_STATUS.CLOSED;
						},

						isTaskClosed: function () {
							"use strict";
							return this.status == TASK_STATUS.CLOSE
						},

						isUnderVerification: function () {
							"use strict";
							return this.status == TASK_STATUS.UNDER_VERIFICATION
						},

						isCompleted: function () {
							"use strict";
							return this.status == TASK_STATUS.CLOSED
						},

						isCancelled: function () {
							"use strict";
							return this.status == TASK_STATUS.CANCELLED;
						},

						/*Conditions */


						_getRole: function () {
							if (this.amITheAssignee() && this.amITheCreator()) {
								return 'TASK_CREATOR_ASSIGNEE'; //Dual role Both Task Craetor and Task Assignee
							}

							if (this.amITheAssignee()) {
								return 'TASK_ASSIGNEE'; //Task Assignee
							}
							if (this.amITheCreator()) {
								return 'TASK_CREATOR'; //Task Creator/Job Owner
							}


						},

						_getAllowedActionsByRole: function () {
							var ROLE = this._getRole();
							var taskRoleActions = {
								'TASK_ASSIGNEE': ['TRY_START', 'TRY_FINISH'],
								'TASK_CREATOR': ['EDIT', 'DELETE', 'TRY_CLOSE', 'TASK_BLOCK'],
								'TASK_CREATOR_ASSIGNEE': ['EDIT', 'DELETE', 'TRY_CLOSE', 'TRY_START', 'TRY_FINISH', 'TASK_BLOCK']
							};

							return taskRoleActions[ROLE];
						},

						$isBlocked: function () {
							"use strict";
							return !!this.isBlocked;
						},

						canExecuteActionByRole: function (event) {
							var allowedActions = this._getAllowedActionsByRole();
							if (_.indexOf(allowedActions, event) >= 0) {
								return true;
							} else {
								return false;
							}
						},

						canExecuteActionByStatus: function (event) {

							var allowedActions = this._getAllowedActionsByStatus();
							if (_.indexOf(allowedActions, event) >= 0) {
								return true;
							} else {
								return false;
							}
						},


						_getAllowedActionsByStatus: function () {

							var taskStatusMap = {
								"-301": "TASK_CREATE",
								"-302": "TASK_START",
								"-303": "TASK_FINISH",
								"-304": "TASK_CLOSE"
							};
							var taskStatus = taskStatusMap[this.status];
							var taskStatusActions = {
								'TASK_CREATE': ['EDIT', 'TASK_BLOCK', 'TASK_UN_BLOCK', 'DELETE', 'TRY_START'],
								'TASK_START': ['TRY_FINISH'],
								'TASK_FINISH': ['EDIT', 'TRY_START', 'TRY_CLOSE'],
								'TASK_CLOSE': []
							};
							return taskStatusActions[taskStatus];
						},


						/*Conditions */

						isTaskLifeCycleEventAvailable: function (eventName) {
							"use strict";
							switch (eventName) {
								case "TRY_START":
									return !this.isUnderVerification() && !this.isNew() && !this.isCancelled() && !this.isCompleted();
									break;
								case "TRY_STOP":
								case "TRY_RESUME":
									return !this.isUnderVerification() && !this.isNew() && !this.isCancelled() && !this.isCompleted();
									break;
								case "TRY_FINISH":
									return !this.isUnderVerification() && !this.isNew() && !this.isCancelled() && !this.isCompleted() && !this.isStopped();
									break;
								case "TRY_CLOSE":
									return !this.isNew() && !this.isCancelled() &&
										this.isUnderVerification();
									break;
								case "TRY_REJECT":
									return !this.isNew() && !this.isCancelled() &&
										this.isUnderVerification();
									break;
								case "TRY_CANCEL":
									return !this.isCancelled() && !this.isUnderVerification() && !this.isCompleted();
									break;
							}
						},

						assign_task: function assign_task(contributorId, taskId) {
							"use strict";
							var deferred = $q.defer(),
								self = this;
							self._isUpdating = true;
							self._isAssigning = true;
							Connect.post(URL.ASSIGN_TASK, {
									contributorId: contributorId,
									taskId: taskId
								})
								.then(function (res) {
									deferred[res.isSuccess ? 'resolve' : 'reject'](res)
								})
								.catch(function (err) {
									deferred.reject(err);
								})
								.finally(function () {
									self._isUpdating = false;
									self._isAssigning = false;

								});
							return deferred.promise;
						},

						try_start: function try_start() {
							"use strict";
							console.log('starting :' + this.id);
							var deferred = $q.defer(),
								self = this;
							self._isUpdating = true;
							self._isStarting = true;
							Connect.post(URL.TASK_TRIGGER_LIFECYCLE_EVENT, {
									taskId: this.id,
									event: TASK_LIFECYCLE_EVENT.TASK_START,
									comment: "comment"
								})
								.then(function (res) {
									res && res.resp && res.resp.status && resource.inject({
										id: self.id,
										status: res.resp.status
									});
									deferred[res.isSuccess ? 'resolve' : 'reject'](res)
								})
								.catch(function (err) {
									deferred.reject(err);
								})
								.finally(function () {
									self._isUpdating = false;
									self._isStarting = false;
								});

							return deferred.promise;
						},

						try_cancel: function try_cancel(comment) {
							"use strict";
							console.log('cancelling :' + this.id);
							var deferred = $q.defer(),
								self = this;
							self._isUpdating = true;
							self._isCancelling = true;
							Connect.post(URL.TASK_TRIGGER_LIFECYCLE_EVENT, {
									taskId: this.id,
									event: TASK_LIFECYCLE_EVENT.TASK_CANCEL,
									comment: comment
								})
								.then(function (res) {
									res && res.resp && res.resp.status && resource.inject({
										id: self.id,
										status: res.resp.status
									});
									deferred[res.isSuccess ? 'resolve' : 'reject'](res)
								})
								.catch(function (err) {
									deferred.reject(err);
								})
								.finally(function () {
									self._isUpdating = false;
									self._isCancelling = false;
								});
							return deferred.promise;
						},

						/**
						 * Send request to resume the job.
						 * @param comment
						 * @returns {*}
						 */
						try_resume: function try_start(comment) {
							"use strict";
							console.log('resuming :' + this.id);
							var deferred = $q.defer(),
								self = this;
							self._isUpdating = true;
							self._isStarting = true;
							Connect.post(URL.TASK_TRIGGER_LIFECYCLE_EVENT, {
									taskId: this.id,
									event: TASK_LIFECYCLE_EVENT.TASK_RESUME,
									comment: comment
								})
								.then(function (res) {
									res && res.resp && res.resp.status && resource.inject({
										id: self.id,
										status: res.resp.status
									});
									deferred[res.isSuccess ? 'resolve' : 'reject'](res)
								})
								.catch(function (err) {
									deferred.reject(err);
								})
								.finally(function () {
									self._isUpdating = false;
									self._isStarting = false;
								});
							return deferred.promise;
						},

						/**
						 * Send a request to stop the job.
						 * @param comment String. Optional message attached to the event.
						 * @returns {Promise[]}
						 */
						try_stop: function try_stop(comment) {
							"use strict";
							console.log('stopping :' + this.id);
							var deferred = $q.defer(),
								self = this;
							self._isUpdating = true;
							self._isStopping = true;
							Connect.post(URL.TASK_TRIGGER_LIFECYCLE_EVENT, {
									taskId: this.id,
									event: TASK_LIFECYCLE_EVENT.TASK_STOP,
									comment: comment
								})
								.then(function (res) {
									res && res.resp && res.resp.status && resource.inject({
										id: self.id,
										status: res.resp.status
									});
									deferred[res.isSuccess ? 'resolve' : 'reject'](res)
								})
								.catch(function (err) {
									deferred.reject(err);
								})
								.finally(function () {
									self._isUpdating = false;
									self._isStopping = false;
								});
							return deferred.promise;
						},

						try_finish: function try_finish(comment) {
							"use strict";
							var deferred = $q.defer(),
								self = this;
							self._isUpdating = true;
							self._isFinishing = true;
							Connect.post(URL.TASK_TRIGGER_LIFECYCLE_EVENT, {
									taskId: this.id,
									event: TASK_LIFECYCLE_EVENT.TASK_FINISH,
									comment: comment
								})
								.then(function (res) {
									res && res.resp && res.resp.status && resource.inject({
										id: self.id,
										status: res.resp.status
									});
									deferred[res.isSuccess ? 'resolve' : 'reject'](res)
								})
								.catch(function (err) {
									deferred.reject(err);
								})
								.finally(function () {
									self._isUpdating = false;
									self._isFinishing = false;
								});
							return deferred.promise;
						},

						try_reject: function try_reject(comment) {
							"use strict";
							var deferred = $q.defer(),
								self = this;
							self._isUpdating = true;
							self._isRejecting = true;
							Connect.post(URL.TASK_TRIGGER_LIFECYCLE_EVENT, {
									taskId: this.id,
									event: TASK_LIFECYCLE_EVENT.TASK_REJECT,
									comment: comment
								})
								.then(function (res) {
									res && res.resp && res.resp.status && resource.inject({
										id: self.id,
										status: res.resp.status
									});
									deferred[res.isSuccess ? 'resolve' : 'reject'](res)
								})
								.catch(function (err) {
									deferred.reject(err);
								})
								.finally(function () {
									self._isUpdating = false;
									self._isRejecting = false;
								});
							return deferred.promise;
						},

						req_toggle_block: function (toBlock) {
							"use strict";
							var deferred = $q.defer(),
								self = this;
							self._isUpdating = true;
							self._isRejecting = true;
							Connect.post(URL.TASK_TOGGLE_BLOCK, {
									taskId: this.id,
									blocked: !!toBlock
								})
								.then(function (res) {
									res && res.resp && res.resp.isBlocked && resource.inject({
										id: self.id,
										isBlocked: res.resp.isBlocked
									});
									deferred[res.isSuccess ? 'resolve' : 'reject'](res)
								})
								.catch(function (err) {
									deferred.reject(err);
								})
								.finally(function () {
									self._isUpdating = false;
									self._isRejecting = false;
								});
							return deferred.promise;
						},

						/**
						 * Send request to Close the job after verifying the job.
						 * This event is successful only if the job is under verification.
						 * @param comment
						 * @returns {*}
						 */
						try_close: function try_close(comment) {
							"use strict";
							var deferred = $q.defer(),
								self = this;
							self._isUpdating = true;
							self._isClosing = true;
							Connect.post(URL.TASK_TRIGGER_LIFECYCLE_EVENT, {
									taskId: this.id,
									event: TASK_LIFECYCLE_EVENT.TASK_CLOSE,
									comment: comment
								})
								.then(function (res) {
									res && res.resp && res.resp.status && resource.inject({
										id: self.id,
										status: res.resp.status
									});
									deferred[res.isSuccess ? 'resolve' : 'reject'](res)
								})
								.catch(function (err) {
									deferred.reject(err);
								})
								.finally(function () {
									self._isUpdating = false;
									self._isClosing = false;
								});
							return deferred.promise;
						},

						loadForms: function loadForms(options) {
							"use strict";
							var self = this,
								params = {
									taskId: this.id
								},
								_options = options || {},
								deferred = $q.defer();

							_options.params && angular.extend(params, _options.params);

							Connect.get(URL.BASE_URL + resource.endpoint +
									resource.customEndpoint.findForms, params)
								.then(function (res) {
									var forms = _parseTaskFormsListingResponse(res.resp.results);
									resource.inject({
										id: self.id,
										forms: forms
									});
									deferred.resolve(res);
								})
								.catch(function (err) {
									deferred.reject(err);
								});
							return deferred.promise;

							function _parseTaskFormsListingResponse(respData) {

								angular.forEach(respData, function (formJSON) {
									formJSON._formType = 'TASK_FORM';
									formJSON.taskId = self.id;
								});

								return respData;
							}
						},

						loadFiles: function (params, options) {
							var taskId = this.id;
							var _params = angular.extend({}, params, {
								taskId: taskId
							});
							var _options = angular.extend({}, options, {
								url: URL.TASK_VAULT_FILE_LIST
							});
							var FileResource = resource.getResource('File');
							return FileResource.findAll(_params, _options)
								.then(function (files) {
									_.each(files, function (file) {
										file.taskId = taskId
									});
									return files;
								});
						},
						loadMeetings: function (params, options) {
							var self = this
								, _params = {}
								, taskId = this.id
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
						},
						deleteFiles: function (fileList, options) {
							var deferred = $q.defer();
							var taskId = this.id;
							var FileResource = resource.getResource('File');
							var destroyReqParams = {
								catType: CATEGORY_TYPE.TASK,
								catId: taskId,
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
							var taskId = this.id,
								url = options.url;
							var FileResource = resource.getResource('File');
							var reqParams = {
								catType: CATEGORY_TYPE.TASK,
								catId: taskId,
								files: fileAttrArray
							};

							return FileResource.updateAll(reqParams, {
								url: url
							})
						},

						fetchVaultFileCopyDestinations: function () {
							var deferred = $q.defer();
							var taskId = this.id;
							var params = {
								catType: CATEGORY_TYPE.TASK,
								catId: taskId
							};
							Connect.get(URL.VAULT_COPY_DESTINATION_LIST, params)
								.then(function (res) {
									deferred.resolve(res.resp);
								})
								.catch(function (err) {
									deferred.reject(err);
								});

							return deferred.promise;
						},

						getFormsByFilter: function getFormsByFilter(options) {
							"use strict";
							var self = this,
								_options = options || {};

							return _.filter(self.forms, function (form) {
								if (_options.triggerCode && form.event != _options.triggerCode) {
									return false;
								}
								if (angular.isDefined(_options.isSubmitted) && form._isSubmitted != _options.isSubmitted) {
									return false;
								}
								return true;
							})
						},

						countFormsByFilter: function (options) {
							"use strict";
							var _options = options || {};
							return this.getFormsByFilter(_options).length;
						},

						addNewForm: function (templateId, formDetails) {
							"use strict";
							var payload = {
									taskId: this.id,
									templateId: templateId
								},
								deferred = $q.defer();
							angular.extend(payload, formDetails);
							Connect.post(URL.BASE_URL + resource.endpoint + resource.customEndpoint.addForm, payload)
								.then(function (res) {
									deferred.resolve(res);
								})
								.catch(function (err) {
									deferred.reject(err);
								});

							return deferred.promise;
						},

						/**
						 * Remove the owner from the task
						 * @param taskOwnerAssignmentId
						 * @returns {*}
						 */
						removeTaskOwner: function (taskOwnerAssignmentId) {
							var reqPayload = {
								id: this.id,  // Task id
								taskAssignmentId: taskOwnerAssignmentId //
							};

							return Connect.post(URL.TASK_REMOVE_MEMBER, reqPayload)
						},

						/**
						 * Remove contributor from the task.
						 * @param userTaskAssignmentId 'taskAssignmentId' of the contributor.
						 * @returns {*}
						 */
						removeTaskMember: function (userTaskAssignmentId) {
							"use strict";
							var reqPayload = {
								id: this.id, // Task id
								taskAssignmentId: userTaskAssignmentId
							};

							return Connect.post(URL.TASK_REMOVE_MEMBER, reqPayload)
						},

						/**
						 * Fetch task assignee user model.
						 * @returns {Promise<User, error>}
						 */
						fetchAssigneeUser: function () {
							"use strict";
							var deferred = $q.defer();
							var taskModel = this;
							var ownerObj = taskModel.owner;

							var UserResource = resource.getResource('User');

							if (ownerObj) {
								UserResource.find(ownerObj.id, {
										bypassCache: true
									})
									.then(function (res) {
										deferred.resolve(res);
									})
									.catch(function (err) {
										deferred.reject(err);
									});
							} else {
								deferred.reject({
									respMsg: LANG.TASK.MESSAGES.ERROR_TASK_ASSIGNEE_NOT_FOUND
								});
							}

							return deferred.promise;
						},

						/**
						 * Fetch task creator user model.
						 * @returns {Promise<User, error>}
						 */
						fetchCreatorUserModel: function () {
							"use strict";
							var deferred = $q.defer();
							var taskModel = this;

							var UserResource = resource.getResource('User');

							if (taskModel.originator) {
								UserResource.find(taskModel.originator.id, {
										bypassCache: true
									})
									.then(function (res) {
										deferred.resolve(res);
									})
									.catch(function (err) {
										deferred.reject(err);
									});
							} else {
								deferred.reject({
									respMsg: LANG.TASK.MESSAGES.ERROR_TASK_ASSIGNEE_NOT_FOUND
								});
							}

							return deferred.promise;
						},

						fetchTaskMemberPage: function (pageSize, pageNumber) {
							var reqParams = {
								taskId: this.id,
								pageSize: pageSize,
								pageNumber: pageNumber
							};
							return this.$_memberCollection.fetch(reqParams, {
								bypassCache: true,
								url: URL.TASK_MEMBERS,
								dataAdapter: function (result) {
									"use strict";
									//if (result.isSuccess && result.resp.results) {
									//	_.each(result.resp.results, function (userJSON) {
									//		userJSON.taskContributorId = userJSON.id;
									//		userJSON.id = userJSON.userid;
									//	});
									//}
									return result;
								}
							})
						},

						searchTaskContributorInvite: function (key) {
							"use strict";
							var reqParams = {
								searchByName: key,
								taskId: this.id,
								inviteType: "TASK_DELEGATOR"
							};
							return Connect.get(URL.TASK_CONTRIBUTOR_INVITEE_SEARCH, reqParams)
								.then(function (res) {
									return res.resp;
								})
						},

						sendTaskContributorInvitation: function (inviteeUserIds, sendToAllFlag) {
							"use strict";
							var taskId = this.id;
							var reqParams = {
								taskId: taskId
							};
							if (inviteeUserIds && inviteeUserIds.length > 0) {
								reqParams.contributors = inviteeUserIds;
							}
							reqParams.sendToAll = !!sendToAllFlag;

							return Connect.post(URL.TASK_CONTRIBUTOR_SEND_INVITATION, reqParams)
								.then(function (res) {
									return res;
								})
						}
					},
					endpoint: "/job/task",
					customEndpoint: {
						create: "/create.ws",
						update: '/update.ws',
						find: '/view.ws',
						findAll: '/list.ws',

						addForm: '/form/create.ws',
						findForms: '/form/list.ws'
					},
					respAdapter: {
						findAll: function (resp) {
							"use strict";
							meta.paginationMetaData = resp.paginationMetaData;
							angular.forEach(resp.results, function (res) {
								if (res.postId) res.id = res.postId;
							});
							return resp.results;
						}
					},
					reqAdapter: {
						find: function (definition, id, options) {
							"use strict";
							return {
								taskId: id
							}
						}
					}
				},
				initResource: function (newResource) {
					"use strict";
					resource = newResource;
				},
				ROLE_NAMES: _.invert(TASK_ROLES)
			}
		}
	])

})();
