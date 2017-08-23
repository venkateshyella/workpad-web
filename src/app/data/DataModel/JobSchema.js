/**
 * Created by sudhir on 14/9/15.
 */


;
(function () {

	var DL = angular.module("DL");


	/**
	 * Job CURD API
	 *
	 * Create
	 * --------
	 * Job.create({
     *    orgId: 135,
     *    title: 'newJob 1',
     *    objective: 'New job 1 objective'
     *    '...': '...'
     * })
	 *   .then(function(JobModel) {})
	 *   .catch(function(error) {})
	 *
	 *
	 * Find
	 * ----
	 * Job.find(<jobId>)
	 *
	 *
	 * Update
	 * ------
	 * Job.update(<jobId>, {
     *    '...': '...'
     * })
	 *
	 * Find all
	 * -------
	 * Job.findAll()
	 *
	 */


	DL.service('JOB', [
		'$q', '$timeout',
		'Connect', 'URL',
		'ROLE', 'JOB_STATUS', 'JOB_LIFECYCLE_EVENT', 'Lang', 'Session', 'CATEGORY_TYPE',
		function JobSchema($q, $timeout, Connect, URL, ROLE, JOB_STATUS, JOB_LIFECYCLE_EVENT, Lang, Session, CATEGORY_TYPE) {

			var ACTIONS = {
					EDIT: 0,
					DELETE_JOB: 1,
					ADVERTISE: 10,
					CREATE_TASK: 20,
					VIEW_CONTRIBUTORS: 30,
					REMOVE_MEMBER: 31,
					ADD_NEW_FILE: 40,
					VIEW_DATA_VAULT: 41,
					VAULT_REMOVE_FILE: 42,
					VAULT_RENAME_FILE: 43,
					VAULT_COPY_FILE: 44,
					ADD_NEW_FORM: 50,
					ENTER_CHATROOM: 60,
				},
				ROLES = {
					ORIGINATOR: ROLE.JOB_ORIGINATOR,
					OWNER: ROLE.JOB_OWNER,
					DELEGATOR: ROLE.JOB_DELEGATOR,
					VISITOR: ROLE.JOB_VISITOR
				},
				viewTaskFlag = false
			/**
			 * List of roles that authorize the action
			 */
				,
				ACTION_AUTHORIZATION_ROLES = {
					EDIT: [ROLES.ORIGINATOR],
					ADVERTISE: [ROLES.ORIGINATOR],
					CREATE_TASK: [ROLES.OWNER],
					//  VIEW_CONTRIBUTORS: [ROLES.ADMIN, ROLES.OWNER],
					VIEW_CONTRIBUTORS: [ROLES.ORIGINATOR, , ROLES.OWNER],
					ADD_NEW_FILE: [ROLES.ORIGINATOR, ROLES.OWNER],
					VIEW_DATA_VAULT: [ROLES.ORIGINATOR, ROLES.OWNER, ROLES.DELEGATOR],
					VAULT_REMOVE_FILE: [ROLES.ORIGINATOR, ROLES.OWNER, ROLES.DELEGATOR],
					VAULT_RENAME_FILE: [ROLES.ORIGINATOR, ROLES.OWNER, ROLES.DELEGATOR],
					VAULT_COPY_FILE: [ROLES.ORIGINATOR, ROLES.OWNER, ROLES.DELEGATOR],
					ADD_NEW_FORM: [ROLES.ORIGINATOR, ROLES.OWNER],
					ENTER_CHATROOM: [ROLES.ORIGINATOR, ROLES.OWNER, ROLES.DELEGATOR],
					DELETE_JOB: [ROLES.ORIGINATOR]
				},
				meta = {
					OWNER_EVENT_ACCESS_MAP: [
						JOB_LIFECYCLE_EVENT.TRY_START,
						JOB_LIFECYCLE_EVENT.TRY_STOP,
						JOB_LIFECYCLE_EVENT.TRY_RESUME,
						JOB_LIFECYCLE_EVENT.TRY_PAUSE,
						JOB_LIFECYCLE_EVENT.TRY_FINISH
					],
					ORIGINATOR_EVENT_ACCESS_MAP: [
						JOB_LIFECYCLE_EVENT.TRY_CLOSE,
						JOB_LIFECYCLE_EVENT.TRY_REJECT,
						JOB_LIFECYCLE_EVENT.TRY_CANCEL
					],
					OWNER_AND_ORIGINATOR_EVENT_ACCESS_MAP: [
						JOB_LIFECYCLE_EVENT.TRY_START,
						JOB_LIFECYCLE_EVENT.TRY_STOP,
						JOB_LIFECYCLE_EVENT.TRY_RESUME,
						JOB_LIFECYCLE_EVENT.TRY_PAUSE,
						JOB_LIFECYCLE_EVENT.TRY_FINISH,
						JOB_LIFECYCLE_EVENT.TRY_CLOSE,
						JOB_LIFECYCLE_EVENT.TRY_REJECT,
						JOB_LIFECYCLE_EVENT.TRY_CANCEL
					],

					LIFECYCLE_EVENT_MAP: {},
					ALLOWED_ACTIONS_BY_STATE: {},
					ALLOWED_ACTIONS_BY_ROLE: {}
				},
				LANG = Lang.en.data,
				resource;

			meta.ALLOWED_ACTIONS_BY_ROLE[ROLE.JOB_OWNER] = [];
			meta.ALLOWED_ACTIONS_BY_ROLE[ROLE.JOB_ORIGINATOR] = ['ADD_NEW_FORM', 'DELETE_JOB', 'REMOVE_MEMBER'];

			meta.ALLOWED_ACTIONS_BY_STATE[JOB_STATUS.NEW] = [
				'ADD_NEW_FORM', 'EDIT', 'ADVERTISE', 'ADD_NEW_FILE', 'VAULT_REMOVE_FILE',
				'VAULT_RENAME_FILE', 'VAULT_COPY_FILE', 'DELETE_JOB'
			];

			meta.ALLOWED_ACTIONS_BY_STATE[JOB_STATUS.START] = [
				'CREATE_TASK', 'VIEW_CONTRIBUTORS', 'REMOVE_MEMBER',
				'ADD_NEW_FILE', 'VIEW_DATA_VAULT', 'VAULT_REMOVE_FILE', 'VAULT_RENAME_FILE', 'VAULT_COPY_FILE',
				'ENTER_CHATROOM'
			];
			meta.ALLOWED_ACTIONS_BY_STATE[JOB_STATUS.CREATE] = [
				'ADVERTISE', 'DELETE_JOB', 'EDIT'
			];
			meta.ALLOWED_ACTIONS_BY_STATE[JOB_STATUS.OWNED] = [
				'ADD_NEW_FORM', 'CREATE_TASK', 'VIEW_CONTRIBUTORS', 'REMOVE_MEMBER',
				'VIEW_DATA_VAULT', 'ADD_NEW_FILE', 'VAULT_REMOVE_FILE', 'VAULT_RENAME_FILE', 'VAULT_COPY_FILE',
				'ENTER_CHATROOM', 'EDIT', 'DELETE_JOB'
			];
			meta.ALLOWED_ACTIONS_BY_STATE[JOB_STATUS.IN_PROGRESS] = [
				'ADD_NEW_FORM', 'CREATE_TASK', 'VIEW_CONTRIBUTORS', 'REMOVE_MEMBER',
				'ADD_NEW_FILE', 'VIEW_DATA_VAULT', 'VAULT_REMOVE_FILE', 'VAULT_RENAME_FILE', 'VAULT_COPY_FILE',
				'ENTER_CHATROOM'
			];
			meta.ALLOWED_ACTIONS_BY_STATE[JOB_STATUS.STOPPED] = ['VIEW_CONTRIBUTORS', 'ENTER_CHATROOM'];
			meta.ALLOWED_ACTIONS_BY_STATE[JOB_STATUS.FINISHED] = ['VIEW_CONTRIBUTORS', 'ENTER_CHATROOM'];
			meta.ALLOWED_ACTIONS_BY_STATE[JOB_STATUS.UNDER_VERIFICATION] = ['VIEW_CONTRIBUTORS', 'ENTER_CHATROOM'];
			meta.ALLOWED_ACTIONS_BY_STATE[JOB_STATUS.REJECTED] = ['VIEW_CONTRIBUTORS', 'ENTER_CHATROOM'];
			meta.ALLOWED_ACTIONS_BY_STATE[JOB_STATUS.CANCELLED] = ['VIEW_CONTRIBUTORS', 'ENTER_CHATROOM'];
			meta.ALLOWED_ACTIONS_BY_STATE[JOB_STATUS.CLOSED] = ['VIEW_CONTRIBUTORS'];

			meta.LIFECYCLE_EVENT_MAP[JOB_STATUS.START] = {
				availableLifecycleEvents: [JOB_LIFECYCLE_EVENT.TRY_FINISH]
			};

			meta.LIFECYCLE_EVENT_MAP[JOB_STATUS.FINISH] = {
				availableLifecycleEvents: [JOB_LIFECYCLE_EVENT.TRY_CLOSE, JOB_LIFECYCLE_EVENT.TRY_START]
			};

			meta.LIFECYCLE_EVENT_MAP[JOB_STATUS.CLOSE] = {
				availableLifecycleEvents: []
			};

			meta.LIFECYCLE_EVENT_MAP[JOB_STATUS.NEW] = {
				availableLifecycleEvents: [JOB_LIFECYCLE_EVENT.TRY_CANCEL]
			};
			meta.LIFECYCLE_EVENT_MAP[JOB_STATUS.CREATE] = {
				availableLifecycleEvents: [JOB_LIFECYCLE_EVENT.TRY_START, JOB_LIFECYCLE_EVENT.TRY_CLOSE]
			};
			meta.LIFECYCLE_EVENT_MAP[JOB_STATUS.OWNED] = {
				availableLifecycleEvents: [JOB_LIFECYCLE_EVENT.TRY_START, JOB_LIFECYCLE_EVENT.TRY_CLOSE]
			};

			meta.LIFECYCLE_EVENT_MAP[JOB_STATUS.IN_PROGRESS] = {
				availableLifecycleEvents: [JOB_LIFECYCLE_EVENT.TRY_PAUSE, JOB_LIFECYCLE_EVENT.TRY_FINISH,
					JOB_LIFECYCLE_EVENT.TRY_CANCEL
				]
			};
			meta.LIFECYCLE_EVENT_MAP[JOB_STATUS.STOPPED] = {
				availableLifecycleEvents: [JOB_LIFECYCLE_EVENT.TRY_RESUME, JOB_LIFECYCLE_EVENT.TRY_CANCEL]
			};
			meta.LIFECYCLE_EVENT_MAP[JOB_STATUS.FINISHED] = {
				availableLifecycleEvents: [JOB_LIFECYCLE_EVENT.TRY_REJECT, JOB_LIFECYCLE_EVENT.TRY_CLOSE]
			};
			meta.LIFECYCLE_EVENT_MAP[JOB_STATUS.UNDER_VERIFICATION] = {
				availableLifecycleEvents: [JOB_LIFECYCLE_EVENT.TRY_REJECT, JOB_LIFECYCLE_EVENT.TRY_CLOSE]
			};
			meta.LIFECYCLE_EVENT_MAP[JOB_STATUS.REJECTED] = {
				availableLifecycleEvents: []
			};
			meta.LIFECYCLE_EVENT_MAP[JOB_STATUS.CANCELLED] = {
				availableLifecycleEvents: []
			};
			meta.LIFECYCLE_EVENT_MAP[JOB_STATUS.CLOSED] = {
				availableLifecycleEvents: []
			};


			return {
				config: {
					name: "Job",
					STATUS: JOB_STATUS,
					EVENT: JOB_LIFECYCLE_EVENT,
					relations: {
						hasMany: {
							Form: {
								localField: 'forms',
								foreignKey: 'jobId',
								get: function (Job, relationDef, instance, origGetter) {
									return origGetter();
								}
							},
							Task: {
								localField: '$_tasks',
								foreignKey: 'jobId'
							},
							JobHistory: {
								localField: 'history',
								foreignKey: 'jobId'
							}
						},
						belongsTo: {
							Organisation: {
								localField: 'organisation',
								localKey: 'orgId'
							}
						}
					},
					meta: meta,
					schema: {},
					computed: {
						/**
						 * TODO(Sudhir) Not use this property as computing the status string everytime can/should be
						 * avoided.
						 */
						displayStatus: {
							enumerable: true,
							get: function () {
								switch (this.status) {
									case JOB_STATUS.NEW:
										return LANG.JOB.JOB_STATUS.NEW;
										break;

									case JOB_STATUS.CREATE:
										return LANG.JOB.JOB_STATUS.CREATE;
										break;

									case JOB_STATUS.START:
										return LANG.JOB.JOB_STATUS.START;
										break;
									case JOB_STATUS.FINISH:
										return LANG.JOB.JOB_STATUS.FINISH;
										break;

									case JOB_STATUS.CLOSE:
										return LANG.JOB.JOB_STATUS.CLOSE;
										break;

									case JOB_STATUS.OWNED:
										return LANG.JOB.JOB_STATUS.OWNED;
										break;
										
									case JOB_STATUS.JOB_OWNED:
										return LANG.JOB.JOB_STATUS.JOB_OWNED;
										break;
										
									case JOB_STATUS.JOB_OWNERSHIP_WAITING:
										return LANG.JOB.JOB_STATUS.JOB_OWNERSHIP_WAITING;
										break;
										
									case JOB_STATUS.JOB_CAN_NOT_BE_OWNED:
										return LANG.JOB.JOB_STATUS.JOB_CAN_NOT_BE_OWNED;
										break;

									case JOB_STATUS.IN_PROGRESS:
										return LANG.JOB.JOB_STATUS.IN_PROGRESS;
										break;

									case JOB_STATUS.STOPPED:
										return LANG.JOB.JOB_STATUS.STOPPED;
										break;

									case JOB_STATUS.FINISHED:
										return LANG.JOB.JOB_STATUS.FINISHED;
										break;

									case JOB_STATUS.UNDER_VERIFICATION:
										return LANG.JOB.JOB_STATUS.UNDER_VERIFICATION;
										break;

									case JOB_STATUS.CANCELLED:
										return LANG.JOB.JOB_STATUS.CANCELLED;
										break;

									case JOB_STATUS.CLOSED:
										return LANG.JOB.JOB_STATUS.CLOSED;
										break;

									default:
										return LANG.JOB.JOB_STATUS.DEFAULT
								}
							}
						},
						_displayStatus: ['status', function (status) {

							switch (status) {
								case JOB_STATUS.NEW:
									return LANG.JOB.JOB_STATUS.NEW;
									break;

								case JOB_STATUS.OWNED:
									return LANG.JOB.JOB_STATUS.OWNED;
									break;

								case JOB_STATUS.IN_PROGRESS:
									return LANG.JOB.JOB_STATUS.IN_PROGRESS;
									break;

								case JOB_STATUS.STOPPED:
									return LANG.JOB.JOB_STATUS.STOPPED;
									break;

								case JOB_STATUS.FINISHED:
									return LANG.JOB.JOB_STATUS.FINISHED;
									break;

								case JOB_STATUS.UNDER_VERIFICATION:
									return LANG.JOB.JOB_STATUS.UNDER_VERIFICATION;
									break;

								case JOB_STATUS.CANCELLED:
									return LANG.JOB.JOB_STATUS.CANCELLED;
									break;

								case JOB_STATUS.CLOSED:
									return LANG.JOB.JOB_STATUS.CLOSED;
									break;

								default:
									return LANG.JOB.JOB_STATUS.DEFAULT
							}
						}],
						JOB_LIFECYCLE_EVENT: [function () {
							"use strict";
							return JOB_LIFECYCLE_EVENT;
						}]
					},
					methods: {
						getMeta: function () {
							return meta;
						},
						/**
						 * Returns True if the current session user is the Originator of the job
						 * @returns {boolean}
						 */
						isOriginator: function () {
							"use strict";
							if (!angular.isArray(this.roles)) {
								return false;
							} else {
								return this.roles.indexOf(ROLE.JOB_ORIGINATOR) != -1;
							}
						},

						isOwner: function () {

							"use strict";
							if (!angular.isArray(this.roles)) {
								return false;
							} else {
								return this.roles.indexOf(ROLE.JOB_OWNER) != -1;
							}

						},

						/**
						 * Returns True if the current session user is the Owner of the job
						 * @returns {boolean}
						 */

						getFullPath: function () {
							"use strict";
							var self = this;
							var fullPath = "";
							if (self.createdFullPath && self.createdFullPath.length > 0) {
								fullPath = self.createdFullPath[self.createdFullPath.length - 1] ?
									self.createdFullPath[self.createdFullPath.length - 1].name
									: '';
							}
							return fullPath;

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
							},
						amITheOwner: function () {
							"use strict";
							//console.log(Session);
							/*if (!angular.isArray(this.roles)) {
							 return false;
							 } else {
							 return this.roles.indexOf(ROLE.JOB_OWNER) != -1;
							 }*/
							if (this.owner) {

								if (this.owner.id == Session.userId) return true;
								else return false;
							} else return false;
						},

						/**
						 * Returns True if the current session user is a Contributor in the job
						 * @returns {boolean}
						 */
						isContributor: function () {
							"use strict";
							if (!angular.isArray(this.roles)) {
								return false;
							} else {
								return this.roles.indexOf(ROLE.JOB_DELEGATOR) != -1;
							}
						},

						isNew: function () {
							"use strict";
							return this.status == JOB_STATUS.NEW;
						},
						isCreated: function () {
							"use strict";
							return this.status == JOB_STATUS.CREATE;
						},

						isClosed: function () {
							"use strict";
							return this.status == JOB_STATUS.CLOSE;
						},

						isOwned: function () {
							"use strict";

							return !!(this.owner && this.owner.id);

							/*return this.status != JOB_STATUS.NEW
							 && this.status != JOB_STATUS.CANCELLED;*/
						},

						hasNotStarted: function () {
							"use strict";
							return this.status == JOB_STATUS.OWNED ||
								this.status == JOB_STATUS.NEW;
						},

						isInProgress: function () {
							"use strict";
							return this.status == JOB_STATUS.IN_PROGRESS
						},

						isStopped: function () {
							"use strict";
							return this.status == JOB_STATUS.STOPPED
						},

						isFinished: function () {
							"use strict";
							return this.status == JOB_STATUS.FINISHED || this.status == JOB_STATUS.UNDER_VERIFICATION || this.status == JOB_STATUS.CLOSED;
						},

						isUnderVerification: function () {
							"use strict";
							return this.status == JOB_STATUS.UNDER_VERIFICATION
						},

						isCompleted: function () {
							"use strict";
							return this.status == JOB_STATUS.COMPLETED
						},

						isCancelled: function () {
							"use strict";
							return this.status == JOB_STATUS.CANCELLED;
						},

						isClosed: function () {
							"use strict";
							return this.status == JOB_STATUS.CLOSE;
						},

						isLifecycleEventAvailable: function isLifecycleEventAvailable(eventCode) {
							"use strict";
							return _.indexOf(this.getAvailableLifecycleEvents(), eventCode) >= 0;
						},

						getAvailableLifecycleEvents: function getAvailableLifecycleEvents() {
							"use strict";
							/*
							 Missing 'status' field check.
							 */
							if (!this.status) {
								return [];
							}
							return meta.LIFECYCLE_EVENT_MAP[this.status].availableLifecycleEvents;
						},

						isLifecycleEventAllowed: function isLifecycleEventAllowed(eventCode) {
							"use strict";
							if (this.amITheOwner() && this.isOriginator()) {

								return _.indexOf(meta.OWNER_AND_ORIGINATOR_EVENT_ACCESS_MAP, eventCode) >= 0;
							} else if (this.amITheOwner()) {
								return _.indexOf(meta.OWNER_EVENT_ACCESS_MAP, eventCode) >= 0;
							} else if (this.isOriginator()) {
								return _.indexOf(meta.ORIGINATOR_EVENT_ACCESS_MAP, eventCode) >= 0;
							} else {
								return false; // For only contributor role
							}

						},

						canExecuteLifecycleEvent: function canExecuteLifecycleEvent(eventCode) {
							"use strict";
							return this.isLifecycleEventAvailable(eventCode) && this.isLifecycleEventAllowed(eventCode);
						},

						canExecuteAction: function canExecuteAction(action) {
							"use strict";
							var allowedActionsByState = meta.ALLOWED_ACTIONS_BY_STATE[this.status],
								availableRoles = this.roles;
							if (
								(allowedActionsByState && _.contains(allowedActionsByState, action)) &&
								ACTION_AUTHORIZATION_ROLES[action] &&
								_.intersection(ACTION_AUTHORIZATION_ROLES[action], availableRoles).length > 0
							) {
								return true;
							} else {
								return false;
							}
						},
						_getRole: function () {

							if (
								(this.originator && Session.userId == this.originator.id
								&& (this.owner && Session.userId == this.owner.id))
							) {
								return 'JOB_ORIGINATOR_OWNER';
							}
							if (this.originator && Session.userId == this.originator.id) {
								return 'JOB_ORIGINATOR';
							}
							if (this.owner && Session.userId == this.owner.id) {
								return 'JOB_OWNER';
							}


						},

						_getAllowedActionsByRole: function () {
							var ROLE = this._getRole();
							var jobRoleActions = {
								'JOB_ORIGINATOR': ['EDIT', 'DELETE_JOB', 'TRY_CLOSE', 'JOB_ADVERTISE', 'VIEW_CONTRIBUTORS'],
								'JOB_OWNER': ['TRY_START', 'TRY_FINISH', 'JOB_INVITE_CONTRIBUTOR', 'VIEW_CONTRIBUTORS', 'CREATE_TASK'],
								'JOB_ORIGINATOR_OWNER': ['EDIT', 'DELETE_JOB', 'TRY_CLOSE', 'JOB_ADVERTISE', 'VIEW_CONTRIBUTORS', 'TRY_START',
									'TRY_FINISH', 'JOB_INVITE_CONTRIBUTOR', 'VIEW_CONTRIBUTORS', 'CREATE_TASK'
								]
							};

							return jobRoleActions[ROLE];
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

							var jobStatusMap = {
								"-301": "JOB_CREATE",
								"-302": "JOB_START",
								"-303": "JOB_FINISH",
								"-304": "JOB_CLOSE",
								"-305":"JOB_OWNERSHIP_WAITING",
								"-306": "JOB_OWNED",
								"-307": "JOB_CAN_NOT_BE_OWNED"
							};
							var jobStatus = jobStatusMap[this.status];
							var jobStatusActions = {
								'JOB_CREATE': ['EDIT', 'DELETE_JOB', 'JOB_ADVERTISE', 'VIEW_CONTRIBUTORS'],
								'JOB_START': ['EDIT','TRY_FINISH', 'VIEW_CONTRIBUTORS', 'JOB_INVITE_CONTRIBUTOR', 'CREATE_TASK'],
								'JOB_FINISH': ['TRY_START', 'TRY_CLOSE', 'VIEW_CONTRIBUTORS'],
								'JOB_CLOSE': [],
								'JOB_OWNERSHIP_WAITING': ['EDIT','DELETE_JOB', 'JOB_ADVERTISE','VIEW_CONTRIBUTORS'],
								'JOB_OWNED': ['EDIT','DELETE_JOB','CREATE_TASK','TRY_START', 'TRY_CLOSE', 'VIEW_CONTRIBUTORS','JOB_INVITE_CONTRIBUTOR'],
								'JOB_CAN_NOT_BE_OWNED': ['EDIT','TRY_START', 'JOB_ADVERTISE','TRY_CLOSE', 'VIEW_CONTRIBUTORS']
							};

							return jobStatusActions[jobStatus];
						},

						/*Conditions */

						fetchActivityHistory: function fetchActivityHistory(pageOptions) {
							"use strict";
							var params = {
									jobId: this.id
								},
								_paginationOptions = pageOptions || {},
								deferred = $q.defer(),
								_url = URL.BASE_URL + resource.endpoint + resource.customEndpoint.history;

							params.pageNumber = _paginationOptions.pageNumber || 1;

							_paginationOptions.pageSize &&
							(params.pageSize = _paginationOptions.pageSize || 1);

							Connect.get(_url, params)
								.then(function (res) {
									deferred.resolve(res);
								})
								.catch(function (err) {
									deferred.reject(err);
								})
								.finally(function () {
								});

							return deferred.promise;
						},

						/**
						 * Returns a list of contributors in the job.
						 */
						getContributorsList: function getDelegateList() {
							"use strict";
							return this._contributors || [];
						},

						loadFiles: function (params, options) {
							var jobId = this.id;
							var _params = angular.extend({}, params, {
								jobId: jobId
							});
							var _options = angular.extend({}, options, {
								url: URL.JOB_VAULT_FILE_LIST,
								bypassCache: true
							});
							var FileResource = resource.getResource('File');
							return FileResource.findAll(_params, _options)
								.then(function (files) {
									_.each(files, function (file) {
										file.jobId = jobId
									});
									return files;
								});
						},
						deleteFiles: function (fileList, options) {
							var deferred = $q.defer();
							var jobId = this.id;
							var FileResource = resource.getResource('File');
							var destroyReqParams = {
								catType: CATEGORY_TYPE.JOB,
								catId: jobId,
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
							var jobId = this.id,
								url = options.url;
							var FileResource = resource.getResource('File');
							var reqParams = {
								catType: CATEGORY_TYPE.JOB,
								catId: jobId,
								files: fileAttrArray
							};

							return FileResource.updateAll(reqParams, {
								url: url
							})
						},
						fetchVaultFileCopyDestinations: function () {
							var deferred = $q.defer();
							var jobId = this.id;
							var params = {
								catType: CATEGORY_TYPE.JOB,
								catId: jobId
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


						/**
						 * Send a request to start the job
						 * @param comment String. Optional message attached to the event.
						 * @returns {Promise[]}
						 */
						try_start: function try_start() {
							"use strict";
							console.log('starting :' + this.id);
							var deferred = $q.defer(),
								self = this;
							self._isUpdating = true;
							self._isStarting = true;
							Connect.post(URL.JOB_TRIGGER_LIFECYCLE_EVENT, {
									jobId: this.id,
									event: JOB_LIFECYCLE_EVENT.TRY_START,
								})
								.then(function (res) {
									res && res.resp && res.resp.status && resource.inject({id: self.id, status: res.resp.status});
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
						 * Cancel Job. This action should be performed by the Originator.
						 * And can be performed anytime before the job is finished.
						 * @param comment Users comment during cancelling the job.
						 */
						try_cancel: function try_cancel(comment) {
							"use strict";
							console.log('cancelling :' + this.id);
							var deferred = $q.defer(),
								self = this;
							self._isUpdating = true;
							self._isCancelling = true;
							Connect.post(URL.JOB_TRIGGER_LIFECYCLE_EVENT, {
									jobId: this.id,
									event: JOB_LIFECYCLE_EVENT.TRY_CANCEL,
									comment: comment
								})
								.then(function (res) {
									res && res.resp && res.resp.status && resource.inject({id: self.id, status: res.resp.status});
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
						try_resume: function try_resume(comment) {
							"use strict";
							console.log('resuming :' + this.id);
							var deferred = $q.defer(),
								self = this;
							self._isUpdating = true;
							self._isStarting = true;
							Connect.post(URL.JOB_TRIGGER_LIFECYCLE_EVENT, {
									jobId: this.id,
									event: JOB_LIFECYCLE_EVENT.TRY_RESUME,
									comment: comment
								})
								.then(function (res) {
									res && res.resp && res.resp.status && resource.inject({id: self.id, status: res.resp.status});
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
							Connect.post(URL.JOB_TRIGGER_LIFECYCLE_EVENT, {
									jobId: this.id,
									event: JOB_LIFECYCLE_EVENT.TRY_STOP,
									comment: comment
								})
								.then(function (res) {
									res && res.resp && res.resp.status && resource.inject({id: self.id, status: res.resp.status});
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

						/**
						 * Send a request to finish the job.
						 * @param comment String. Optional message attached to the event.
						 * @returns {Promise}
						 */
						try_finish: function try_finish(disclaimerMessage, acknowledgement) {
							"use strict";
							var deferred = $q.defer(),
								self = this;
							self._isUpdating = true;
							self._isFinishing = true;
							Connect.post(URL.JOB_TRIGGER_LIFECYCLE_EVENT, {
									jobId: this.id,
									event: JOB_LIFECYCLE_EVENT.TRY_FINISH,
									disclaimerMessage: disclaimerMessage,
									acknowledgement: acknowledgement
								})
								.then(function (res) {
									res && res.resp && res.resp.status && resource.inject({id: self.id, status: res.resp.status});
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

						/**
						 * Send request to reject the job.
						 * This event is successful only if the job is under verification.
						 * @param comment
						 * @returns {*}
						 */
						try_reject: function try_reject(comment) {
							"use strict";
							var deferred = $q.defer(),
								self = this;
							self._isUpdating = true;
							self._isRejecting = true;
							Connect.post(URL.JOB_TRIGGER_LIFECYCLE_EVENT, {
									jobId: this.id,
									event: JOB_LIFECYCLE_EVENT.TRY_REJECT,
									comment: comment
								})
								.then(function (res) {
									res && res.resp && res.resp.status && resource.inject({id: self.id, status: res.resp.status});
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
						try_close: function try_close(disclaimerMessage, acknowledgement) {
							"use strict";
							var deferred = $q.defer(),
								self = this;
							self._isUpdating = true;
							self._isClosing = true;
							Connect.post(URL.JOB_TRIGGER_LIFECYCLE_EVENT, {
									jobId: this.id,
									event: JOB_LIFECYCLE_EVENT.TRY_CLOSE,
									disclaimerMessage: disclaimerMessage,
									acknowledgement: acknowledgement
								})
								.then(function (res) {
									res && res.resp && res.resp.status && resource.inject({id: self.id, status: res.resp.status});
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

						submitJobTime: function submitJobTime(hrs) {
							"use strict";
							console.log('submitting time for Job:' + this.id);
							var deferred = $q.defer(),
								self = this;
							Connect.post(URL.JOB_TIMESHEET_CREATE, {
									jobId: this.id,
									hours: hrs
								})
								.then(function (res) {
									deferred.resolve(res);
								})
								.catch(function (err) {
									deferred.reject(err);
								})
								.finally(function () {
								});
							return deferred.promise;
						},

						/**
						 *
						 * Fetch list of users who are contributors in the job.
						 * @param pageOptions Pagination options
						 *  - pageSize
						 *  - pageNumber
						 *
						 * @returns {Promise[Array]}
						 */
						findContributors: function findContributors(pageOptions) {
							"use strict";

							var deferred = $q.defer(),
								self = this,
								params = {
									jobId: self.id
								};
							pageOptions && pageOptions.pageSize && (params.pageSize = pageOptions.pageSize);

							pageOptions && pageOptions.pageNumber && (params.pageNumber = pageOptions.pageNumber);

							self._isUpdating = true;
							self._isLoadingContributorsList = true;
							Connect.get(URL.JOB_CONTRIBUTORS_LIST, params)
								.then(function (res) {
									res && res.resp && (self._contributors = res.resp);
									deferred.resolve(res);
								})
								.catch(function (err) {
									deferred.reject(err);
								})
								.finally(function () {
									self._isUpdating = false;
									self._isLoadingContributorsList = false;
								});

							return deferred.promise;

						},

						/**
						 * Search the job contributors with matching user first and last name.
						 * @param queryName
						 * @returns {Promise[Array]}
						 */
						searchForContributors: function searchForContributors(queryName) {
							"use strict";
							var deferred = $q.defer();
							var reqParams = {
								inviteType: 'DELEGATOR',
								orgId: this.organization.id,
								jobId: this.id,
								searchByName: queryName
							};

							Connect.get(URL.ORG_MEMBER_SEARCH, reqParams)
								.then(function (res) {
									deferred.resolve(res);
								})
								.catch(function (err) {
									deferred.reject(err);
								})
								.finally(function () {
									this._isUpdating = false;
								});

							return deferred.promise;
						},

						/**
						 * Job advertisement invited owners pending list
						 * @returns {Promise[Array]}
						 */
						advertiseInviteOwnerpendingList: function advertiseInviteOwnerpendingList() {
							"use strict";
							var deferred = $q.defer();
							var reqParams = {
								jobId: this.id
							};

							Connect.get(URL.JOB_ADV_INVITED_OWNERS_LIST, reqParams)
								.then(function (res) {
									deferred.resolve(res);
								})
								.catch(function (err) {
									deferred.reject(err);
								})
								.finally(function () {
									this._isUpdating = false;
								});
							return deferred.promise;
						},


						inviteContributorpendingList: function inviteContributorpendingList() {

							"use strict";
							var deferred = $q.defer();
							var reqParams = {
								jobId: this.id
							};

							Connect.get(URL.JOB_CONTRIBUTOR_INVITED_LIST, reqParams)
								.then(function (res) {
									deferred.resolve(res);
								})
								.catch(function (err) {
									deferred.reject(err);
								})
								.finally(function () {
									this._isUpdating = false;
								});
							return deferred.promise;

						},

						/**
						 * Send invitation to a user to become a contributor in the job.
						 * @param user
						 * @returns {Promise[Object]}
						 */
						/*sendInviteToContributor: function sendInviteToContributor(user, invitationMessage) {
						 "use strict";

						 var deferred = $q.defer()
						 , jobId = this.id
						 , invitationType = 'SELECTION'
						 , members = []
						 , reason = invitationMessage
						 ;

						 members.push(user.id);

						 Connect.post(URL.JOB_INIVITE_CONTRIBUTOR, {
						 jobId: jobId,
						 invitationType: invitationType,
						 members: members,
						 reason: reason
						 })
						 .then(function (res) {
						 console.log(res);
						 deferred.resolve(res);
						 })
						 .catch(function (err) {
						 deferred.reject(err);
						 })
						 ;

						 return deferred.promise;


						 },*/

						sendInviteToContributor: function sendInviteToContributor(invitationMessage, invitations) {
							"use strict";

							var deferred = $q.defer(),
								jobId = this.id,
								orgId = this.orgId
							//, invitationType = 'SELECTION'
								,
								members = [],
								reason = invitationMessage;

							//  members.push(user.id);

							Connect.post(URL.JOB_INIVITE_CONTRIBUTOR, {
									jobId: jobId,
									orgId: orgId,
									reason: reason,
									invitations: invitations
								})
								.then(function (res) {
									console.log(res);
									deferred.resolve(res);
								})
								.catch(function (err) {
									deferred.reject(err);
								});

							return deferred.promise;


						},

						/**
						 * Adds a new form to the job
						 */
						addNewForm: function addNewForm(templateId, formDetails) {
							"use strict";
							var payload = {
									jobId: this.id,
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
						 * Todo(Sudhir) Ideally this API should be provided though the loadRelation API.
						 * (used to lazy load related models)
						 * But since the service does not provide any foreign key variable
						 * in the form listing data. Automatic linking of related models is not working.
						 *
						 * Todo(Server Team) Update the service by adding foreign key mapping.
						 *
						 * @param paginationData
						 * @returns {Promise}
						 */
						loadForms: function loadAllForms(params, options) {
							"use strict";
							var deferred = $q.defer(),
								self = this,
								_params = {
									jobId: this.id
								};
							angular.extend(_params, params);
							Connect.get(URL.FORM_LIST, _params)
								.then(function (res) {
									resource.meta.loadForms_paginationData = res.resp.paginationMetaData;
									angular.forEach(res.resp.results, function (formJSON) {
										formJSON.jobId = self.id;
										formJSON._formType = 'JOB_FORM';
									});
									resource.inject({
										id: self.id,
										forms: res.resp.results
									});
									deferred.resolve(res.resp.results);
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

						findJobMembersToRate: function () {
							"use strict";
							var jobId = this.id,
								deferred = $q.defer();
							Connect.get(URL.JOB_MEMBER_UNRATED_LIST, {
									jobId: jobId
								})
								.then(function (res) {
									var respData = res.resp;
									if (respData && respData.users) {
										deferred.resolve(respData.users);
									} else {
										deferred.reject();
									}
								})
								.catch(function (err) {
									deferred.reject(err);
								});

							return deferred.promise;
						},

						/**
						 * Submit Users ratings for a job.
						 * @url /job/rating/save.ws
						 * @method POST
						 * @payload {
                         *  jobId: ...
                         *  users: [
                         *    {
                         *      id: <Id of the user>,
                         *      overallRating: <Overall skill of the user>,
                         *      skills: [
                         *        {
                         *          id: Skill id,
                         *          rating: Rating metric {x|x∈Z, 0 ≤ x ≤ 5}
                         *        }
                         *      ]
                         *    }
                         *  ]
                         *
                         * }
						 *
						 * @param jobMembersRatings
						 * @returns {*}
						 */

						submitUserRating: function (jobMembersRatings) {
							"use strict";
							var jobId = this.id;
							return Connect.post(URL.JOB_MEMBER_RATING_SUBMIT, {
								jobId: jobId,
								users: jobMembersRatings
							})
						},

						/* Remove Member */
						removeMember: function (userId) {
							"use strict";
							var jobId = this.id;
							var reqPayload = {
								id: jobId,
								contributorId: userId
							};
							return Connect.post(URL.JOB_MEMBER_REMOVE, reqPayload)
								.then(function (res) {
									var UserResource = resource.getResource('User');
									console.log(this);
									return res;
								});
						},

						ejectTasks: function () {
							"use strict";
							var TaskResource = resource.getResource('Task');
							var taskIds = _.pluck(this.$_tasks, 'id');
							TaskResource.ejectAll({
								where: {
									'id': {
										in: taskIds
									}
								}
							})
						},

						getMyTasks: function () {
							var jobModel = this;

							var myTasksList = jobModel.tasks;
							var TaskResource = resource.getResource('Task')
							TaskResource.inject(myTasksList);

							return TaskResource.filter({
								where: {
									'id': {
										in: _.pluck(myTasksList, 'id')
									}
								}
							})
						}
					},
					endpoint: "/job",
					customEndpoint: {
						create: "/create.ws",
						find: '/find.ws',
						findAll: '/list.ws',
						update: '/update.ws',

						addForm: '/form/create.ws',
						activityHistory: '/history.ws'
					}, createJobUsingTemplate: function (params) {
						var deferred = $q.defer();

						Connect.post(URL.JOB_CREATE_USING_TEMPLATE,params)
							.then(function (res) {
								deferred.resolve(res);
							}).catch(function (error) {
							deferred.reject(error);
						}).finally(function () {
						});
						
						return deferred.promise;
					},
					respAdapter: {
						findAll: function (resp) {
							"use strict";
							meta.paginationMetaData = resp.paginationMetaData;
							angular.forEach(resp.results, function (res) {
								if (res.organization && res.organization.id) {

									/* Save Organisation data if available. */
									var Organisation = resource.getResource('Organisation');
									Organisation.inject(res.organization);
									res.orgId = res.organization.id;
								}
							});
							return resp.results;
						}
					},
					reqAdapter: {
						find: function (definition, id, options) {
							"use strict";
							var req = {},
								_options = options || {};

							angular.isDefined(_options.tasks);
							return {
								jobId: id,
								tasks: angular.isDefined(_options.tasks) ? _options.tasks : false,
								files: angular.isDefined(_options.files) ? _options.tasks : false,
								contributors: angular.isDefined(_options.contributors) ? _options.tasks : false,
							}
						}
					}
				},
				initResource: function (newResource) {
					"use strict";
					resource = newResource;
				},
				ROLES: ROLES,
				ROLE_NAMES: _.invert(ROLES),
				viewTaskFlag: viewTaskFlag
			}
		}
	])

})();