/**
 * Created by sudhir on 1/12/15.
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
						APP_POST.TYPE.POST_NOTIFICATION_GROUP_INVITATION_REPLY_ACCEPT,
						APP_POST.TYPE.POST_NOTIFICATION_GROUP_INVITATION_REPLY_REJECT
					],
					function (post, options) {
						var deferred = $q.defer()
							, group = post.group
							, organisation = post.organization
							, options = options || {}
							;

						DataProvider.resource.Group.inject(group);
						DataProvider.resource.Organisation.inject(organisation);

						PostHandlerBaseService.showPostNotificationHandlerDialog({
							locals: {
								post: post,
								xtras: {
									//secText: "Group Members",
									priText: "Ok"
								}
							},
							targetEvent: options.targetEvent
						})
							.then(function(res) {
								if(res == 'sec') {
									State.transitionTo('root.app.group-dashboard.groupMembers', {
										groupId: group.id,
										orgId: organisation.id
									});
								}
								deferred.resolve();
							})
							.catch(function() {
								deferred.reject();
							})
						;

						return deferred.promise;

					});

				PostService.registerPostHandler([
					APP_POST.TYPE.POST_NOTIFICATION_GROUP_VAULT_FILE_ADD,
					APP_POST.TYPE.POST_NOTIFICATION_GROUP_VAULT_FILE_DEL,
					APP_POST.TYPE.POST_NOTIFICATION_GROUP_VAULT_FILE_RENAME
				], function (post, options) {
					var deferred = $q.defer()
						, group = post.group
						, organisation = post.organization
						, options = options || {}
						;

					DataProvider.resource.Group.inject(group);
					DataProvider.resource.Organisation.inject(organisation);

					PostHandlerBaseService.showPostNotificationHandlerDialog({
						locals: {
							post: post,
							xtras: {
								//secText: "Group Vault",
								priText: "Ok"
							}
						},
						targetEvent: options.targetEvent
					})
						.then(function(res) {
							if(res == 'sec') {
								State.transitionTo('root.app.group-dashboard.groupVault', {
									groupId: group.id,
									orgId: organisation.id
								});
							}
							deferred.resolve();
						})
						.catch(function() {
							deferred.reject();
						})
					;

					return deferred.promise;
				})

				PostService.registerPostHandler([
					APP_POST.TYPE.POST_NOTIFY_CREATE_GROUP,
					APP_POST.TYPE.POST_NOTIFY_CREATE_GROUP_REJECT
				], function (post, options) {
					var deferred = $q.defer()
						, group = post.group
						, organisation = post.organization
						, options = options || {}
						;

					DataProvider.resource.Group.inject(group);
					DataProvider.resource.Organisation.inject(organisation);

					PostHandlerBaseService.showPostNotificationHandlerDialog({
						locals: {
							post: post,
							xtras: {
								//secText: "Group Dashboard",
								priText: "Ok"
							}
						},
						targetEvent: options.targetEvent
					})
						.then(function(res) {
							if(res == 'sec') {
								State.transitionTo('root.app.group-dashboard.groupInfo', {
									orgId: organisation.id,
									groupId: group.id
								});
							}
							deferred.resolve();
						})
						.catch(function() {
							deferred.reject();
						})
					;

					return deferred.promise;
				})

			}])
})();