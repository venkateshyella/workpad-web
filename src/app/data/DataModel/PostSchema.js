/**
 * Created by sudhir on 12/6/15.
 */


;
(function () {

	var DL = angular.module("DL");

	DL.service('POST', [
		'Session', '$q', 'Connect', 'URL', 'Lang',
		function PostSchema(Session, $q, Connect, URL, Lang) {

			var LANG = Lang.data;
			var meta = {
				POST_READ_STATUS: {
					READ: -2,
					UNREAD: -1
				},
				NOTIFICATION_CATEGORY_LIST: {
					INFORMATION: -1,
					ACTION: -2,
					SPONSOR: -3
				}
			};

			return {
				config: {
					name: "Post",
					schema: {},
					meta: meta,
					computed: {
						createdDate_displayText: ['createDate', function (createDate) {
							"use strict";
							return mobos.Utils.getDisplayDateTime(createDate);
						}],
						isRead: {
							get: function () {
								"use strict";
								return this.status == -2;
							}
						},
						$_notificationCategoryText: ['notificationCategory', function (NotifigationCategory) {
							"use strict";
							switch (NotifigationCategory) {
								case meta.NOTIFICATION_CATEGORY_LIST.INFORMATION:
									return LANG.POST.LABEL.LABEL_POST_TYPE_INFORMATION;
									break;
								case meta.NOTIFICATION_CATEGORY_LIST.ACTION:
									return LANG.POST.LABEL.LABEL_POST_TYPE_ACTION;
									break;
								case meta.NOTIFICATION_CATEGORY_LIST.SPONSOR:
									return LANG.POST.LABEL.LABEL_POST_TYPE_SPONSOR;
									break;
								default:
									return "";
							}
						}]
					},
					methods: {
						getMeta: function () {
							return meta;
						},
						/**
						 *
						 * @param {boolean=} markAsRead
						 * @param {Object?} options
						 *  - bypassCache boolean:true Set this to false to update the local copy only, and skip the service call.
						 * @returns {*}
						 */
						toggleRead: function (markAsRead, options) {
							"use strict";
							var deferred = $q.defer()
								, self = this
								, _markAsRead
								, _options = options || {
										bypassCache: true
									}
								;
							if (angular.isDefined(markAsRead)) {
								_markAsRead = !!markAsRead;
							} else {
								_markAsRead = !self.status
							}
							// Update local copy only
							if (!_options.bypassCache) {
								deferred.resolve();
								self.status = _markAsRead
									? meta.POST_READ_STATUS.READ
									: meta.POST_READ_STATUS.UNREAD;
								return deferred.promise;
							}
							Connect.post(URL.POST_UPDATE, {
									id: self.id,
									status: _markAsRead
										? meta.POST_READ_STATUS.READ
										: meta.POST_READ_STATUS.UNREAD
								})
								.then(function (res) {
									self.status = _markAsRead
										? meta.POST_READ_STATUS.READ
										: meta.POST_READ_STATUS.UNREAD;
									deferred.resolve(res);
								})
								.catch(function (err) {
									deferred.reject(err);
								})
							;
							return deferred.promise;
						}
					},
					endpoint: "/post",
					customEndpoint: {
						findAll: "/list.ws",
						find: "/view.ws"
					},
					respAdapter: {
						findAll: function (resp) {
							meta.paginationMetaData = resp.paginationMetaData;
							angular.forEach(resp.results, function (res) {
								if (res.postId) res.id = res.postId;
							});
							return resp.results;
						},
						defaultAdapter: function (resp) {
							return resp;
						}
					},
					reqAdapter: {
						defaultAdapter: function (req) {
							return req;
						},
						find: function (definition, id, options) {
							"use strict";
							return {
								postId: id
							}
						}
					}
				}
			}
		}
	])

})();