/**
 * Created by sudhir on 12/6/15.
 */


;
(function () {
	"use strict";

	var app = angular.module('app.modules')

		.service('PostControllerService', [
			'PostService',
			PostControllerService])

		.provider('PostService', [
			PostService])

		.service('PostHandlerBaseService', [
			'$q', 'mDialog', 'DataProvider', 'Connect', 'URL', 'Lang',
			PostHandlerBaseService
		])
		;

	var POST_STATUS = {
		UNREAD: '-1',
		READ: '-2',
		DELETED: '-3'
	};


	function PostControllerService(PostService) {

		return {
			POST_STATUS: POST_STATUS,
			runPostHandler: runPostHandler
		};

		/**
		 *
		 * @param post {object} Post object
		 * @param options {object} Optional preview options.
		 */
		function runPostHandler(post, options) {
			return PostService.runPostHandler(post, options);
		}
	}

	function PostHandlerBaseService($q, Dialog, DataProvider
		, Connect, URL, Lang) {

		var LANG = Lang.en.data;

		return {
			previewPost: previewPost,
			runHandler: runDefaultHandler,
			showPostNotificationHandlerDialog: function (dialogConfig, options) {
				var defaultDialogOptions = {
					templateUrl: "app/modules/posts/templates/postDetails.dialog.tpl.html",
					controller: ['$scope', '$mdDialog', 'LANG', 'post', 'xtras',
						defaultDialogController]
				};
				var config = angular.extend({}, defaultDialogOptions, dialogConfig);
				var _options = angular.extend({}, options);
				config.locals = config.locals || {};
				config.locals.LANG = LANG;
				var post = config.locals.post;
				var deferred = $q.defer();
				Dialog.show(config)
					.then(function (res) {
						if (_options.skipPostAutoUpdate) {
							deferred.resolve(res);
						} else {
							return post.toggleRead(true)
								.then(function () {
									deferred.resolve(res);
								});
						}
					});
				return deferred.promise;
			}
		};

		function previewPost(post) {
		}

		function runDefaultHandler(post, options) {
			options = options || {};
			var post = post
				;

			return Dialog.show({
				templateUrl: 'app/modules/posts/templates/postDetails.dialog.tpl.html',
				controller: ['$scope', '$mdDialog', 'LANG', 'post', 'xtras', defaultDialogController],
				locals: {
					LANG: LANG,
					post: post,
					xtras: {
						priText: LANG.BUTTON.OK
					}
				}
			}, {
				clickOutsideToClose: true
			});

			function defaultDialogController($scope, $mdDialog, LANG, post, xtras) {
				$scope.cancel = $mdDialog.cancel;
				$scope.close = $mdDialog.hide;

				$scope.xtras = xtras;

				$scope.okText = LANG.BUTTON.OK;
				$scope.post = post;
				//$scope.NotificationCategory = "Action";

				var NotificationCategoryList = {
					POST_NOTIFICATION_CATEGORY_INFORMATION: -1,
					POST_NOTIFICATION_CATEGORY_ACTION: -2,
					POST_NOTIFICATION_CATEGORY_SPONSOR: -3
				};
				var NotificationCategory = "";
				switch ($scope.post.notificationCategory) {
					case NotificationCategoryList.INFORMATION:
						NotificationCategory = "Information";
						break;
					case NotificationCategoryList.ACTION:
						NotificationCategory = "Action";
						break;
					case NotificationCategoryList.SPONSOR:
						NotificationCategory = "Sponser";
						break;
					default:
						NotificationCategory = "";
				}

				$scope.NotificationCategory = NotificationCategory;


				console.log(post);
			}
		}

		function defaultDialogController($scope, $mdDialog, LANG, post, xtras) {
			$scope.cancel = $mdDialog.cancel;
			$scope.close = $mdDialog.hide;

			$scope.xtras = xtras;

			$scope.okText = LANG.BUTTON.OK;
			$scope.post = post;

			var NotificationCategoryList = {
				POST_NOTIFICATION_CATEGORY_INFORMATION: -1,
				POST_NOTIFICATION_CATEGORY_ACTION: -2,
				POST_NOTIFICATION_CATEGORY_SPONSOR: -3
			};
			var NotificationCategory = "";
			switch ($scope.post.notificationCategory) {
				case NotificationCategoryList.INFORMATION:
					NotificationCategory = "Information";
					break;
				case NotificationCategoryList.ACTION:
					NotificationCategory = "Action";
					break;
				case NotificationCategoryList.SPONSOR:
					NotificationCategory = "Sponser";
					break;
				default:
					NotificationCategory = $scope.post.title;
			}

			$scope.NotificationCategory = NotificationCategory;
		}

	}

	function PostService() {

		var postHandler = {}
			, postDefinition_bucket = {}
			;

		var defaultPostDefinition = {
			//templateUrl: 'app/modules/posts/templates/defaultPostItem.partial.html',
			templateUrl: 'app/modules/posts/templates/defaultWebPostItem.partial.html',
			controller: [defaultPostController]
		};

		return {
			definePost: definePost,
			$get: ['$rootScope', 'Connect', 'URL',
				'DataProvider', 'PostHandlerBaseService',
				'postHandler_Invitation',
				'RequestApprovalPostHandler',
				'NotificationPostHandler',
				'JobPostsHandler', 'TaskPostsHandler',
				'APP_POST',
				'MeetingPostHandler','SubscriptionPostHandler',
				PostServiceApi]
		};

		function defaultPostController() {
		}

		function definePost(postType, postDefinition) {
			if (postType instanceof Array) {
				var postTypeArray = postType;
				postTypeArray.forEach(function (postType) {
					postDefinition_bucket[postType] = {
						type: postType,
						definition: postDefinition
					}
				})
			} else {
				postDefinition_bucket[postType] = {
					type: postType,
					definition: postDefinition
				}
			}
		}

		/**
		 * Dashboard Posts handler. (Process posts or notifications.)
		 * The service is used to handle posts or notifications through the dashboard
		 * or though notification system. Any valid post object with a valid post attrs
		 * can be processed by the service.
		 *
		 * Each post can be handled separately by registering a handler for the
		 * specific post type. see `registerPostHandler` function.
		 * A default handler is used if a dedicated handles is not registered
		 *
		 */

		function PostServiceApi($rootScope, Connect, URL
			, DataProvider, PostHandlerBaseService
			, postHandler_Invitation, RequestApprovalPostHandler
			, NotificationPostHandler
			, JobPostsHandler, TaskPostsHandler
			, APP_POST
			, MeetingPostHandler, SubscriptionPostHandler) {

			// Register new post handler.
			registerPostHandler(
				APP_POST.TYPE.POST_INVITATION_TO_ORGANISATION_NOTIFY_INVITEE,
				postHandler_Invitation.replyToInvitationToJoinOrganisation);

			registerPostHandler(
				APP_POST.TYPE.POST_INVITATION_TO_GROUP_NOTIFY_INVITEE,
				postHandler_Invitation.replyToInvitationToJoinGroup);

			/* Request post to create a new group. */
			registerPostHandler(
				APP_POST.TYPE.POST_REQ_TO_CREATE_GROUP,
				RequestApprovalPostHandler.handle_createGroupRequest);

			// Job advertisement post handler
			registerPostHandler(
				APP_POST.TYPE.POST_JOB_ADVERTISEMENT,
				JobPostsHandler.handle_jobAdvertisementPost);

			// Task Contributor invitation post handler
			registerPostHandler(
				APP_POST.TYPE.POST_INVITATION_JOIN_JOB,
				postHandler_Invitation.replyToInvitationToJoinJob);
			
			registerPostHandler(
					APP_POST.TYPE.POST_TYPE_EVENT_REMAINDER_NOTIFICATION,
					postHandler_Invitation.replyToInvitationToJoinEvents);
			
			registerPostHandler(
					APP_POST.TYPE.POST_TYPE_SUBSCRIPTION_INFO_NOTIFICATION,
					SubscriptionPostHandler.handle_subscriptionRequest);

			registerPostHandler(
					APP_POST.TYPE.POST_TYPE_DATA_VAULT_ALERT,
					SubscriptionPostHandler.handle_subscriptionRequest);

			registerPostHandler(
					APP_POST.TYPE.POST_TYPE_DATA_VAULT_WARNING,
					SubscriptionPostHandler.handle_subscriptionRequest);

			registerPostHandler(
					APP_POST.TYPE.POST_TYPE_DATA_VAULT_RESTRICT,
					SubscriptionPostHandler.handle_subscriptionRequest);

			return {
				runPostHandler: runPostHandler,
				getPostDefinition: getPostDefinition,
				registerPostHandler: registerPostHandler,
				createPostAuditListLoader: createPostAuditListLoader
			};

			function runPostHandler(post, options) {
				var handler = postHandler[post.postType] && postHandler[post.postType].fn;
				if (handler) {
					/* Run the registered post handler. */
					return handler(post, options)
						.then(function (res) {
							return res;
						});
				} else {
					/* Default handler. */
					return PostHandlerBaseService.runHandler(post, options)
						.then(function (res) {
							post.toggleRead(true)
								.then(function () {
								});
							return res;
						});
				}
			}

			function getPostDefinition(post) {
				var postDefinitionObj = postDefinition_bucket[post.postType];
				if (postDefinitionObj) {
					return postDefinitionObj.definition;
				} else {
					return defaultPostDefinition;
				}
			}

			function createPostAuditListLoader(auditArray) {
				DataProvider.resource.Audit.createCollection(auditArray);
				return DataProvider.PaginatedListLoaderFactory(
					auditArray, 'fetch', {}, 25, {
						apiParams: {
							bypassCache: true,
							url: URL.LIST_POST_AUDIT
						}
					});
			}
		}

		function registerPostHandler(post_type, fn) {

			if (post_type instanceof Array) {
				for (var i in post_type) {
					postHandler[post_type[i]] = {
						type: post_type[i],
						fn: fn
					}
				}
			} else {
				postHandler[post_type] = {
					type: post_type,
					fn: fn
				}
			}
		}

	}


})();