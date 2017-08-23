/**
 * Created by sudhir on 30/11/15.
 */

;
(function () {
	"use strict";

	angular.module('app.modules')
		.run([
			'PostService', 'PostHandlerBaseService', 'APP_POST',
			'DataProvider',
			'mDialog', '$q', 'State',
			function (PostService, PostHandlerBaseService, APP_POST
				, DataProvider
				, Dialog, $q, State) {

				PostService.registerPostHandler([
						APP_POST.TYPE.POST_NOTIFICATION_ORG_MEMBERSHIP_REMOVE,
						APP_POST.TYPE.POST_NOTIFICATION_INVITATION_TO_ORGANISATION_REPLY_ACCEPT,
						APP_POST.TYPE.POST_NOTIFICATION_INVITATION_TO_ORGANISATION_REPLY_REJECT
					],
					function (post, options) {
						var organisation = post.organization
							, options = options || {}
							;

						DataProvider.resource.Organisation.inject(organisation);

						var deferred = $q.defer();

						PostHandlerBaseService.showPostNotificationHandlerDialog({
							locals: {
								post: post,
								xtras: {
									//secText: "Members",
									priText: "Ok"
								}/*,
								notificationCategory : "Information"*/
							},
							targetEvent: options.targetEvent
						})
							.then(function (res) {
								if (res == 'sec') {
									State.transitionTo('root.app.org-dashboard.orgMembers', {
										orgId: organisation.id
									});
								}
								deferred.resolve();
							})
							.catch(function () {
								deferred.reject();
							})
						;

						return deferred.promise;
					});

				PostService.registerPostHandler([
						APP_POST.TYPE.POST_NOTIFICATION_ORG_VAULT_FILE_ADD,
						APP_POST.TYPE.POST_NOTIFICATION_ORG_VAULT_FILE_DEL,
						APP_POST.TYPE.POST_NOTIFICATION_ORG_VAULT_FILE_RENAME
					],
					function (post, options) {
						var deferred = $q.defer()
							, organisation = post.organization
							, options = options || {}
							;

						DataProvider.resource.Organisation.inject(organisation);

						PostHandlerBaseService.showPostNotificationHandlerDialog({
							locals: {
								post: post,
								xtras: {
									//secText: "Data Vault",
									priText: "Ok"
								}
							},
							targetEvent: options.targetEvent
						})
							.then(function (res) {
								if (res == 'sec') {
									State.transitionTo('root.app.org-dashboard.orgVault', {
										orgId: organisation.id
									});
								}
								deferred.resolve();
							})
							.catch(function () {
								deferred.reject();
							})
						;

						return deferred.promise;
					});

				PostService.registerPostHandler([
						APP_POST.TYPE.POST_NOTIFY_CREATE_ORG
					],
					function (post, options) {
						var deferred = $q.defer()
							, options = options || {}
							, organisation = post.organization
							;

						DataProvider.resource.Organisation.inject(organisation);

						PostHandlerBaseService.showPostNotificationHandlerDialog({
							locals: {
								post: post,
								xtras: {
									//secText: "Organisation",
									priText: "Ok"
								}
							},
							targetEvent: options.targetEvent
						})
							.then(function (res) {
								if (res == 'sec') {
									State.transitionTo('root.app.org-dashboard.orgInfo', {
										orgId: organisation.id
									});
								}
								deferred.resolve();
							})
							.catch(function () {
								deferred.reject();
							})
						;

						return deferred.promise;
					});

			}
		])

})();