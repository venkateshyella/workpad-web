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
						APP_POST.TYPE.POST_TYPE_EVENT_CREATE_NOTIFICATION,
						APP_POST.TYPE.POST_TYPE_EVENT_UPDATE_NOTIFICATION
					],
					function (post, options) {
						var deferred = $q.defer()
							, group = post.group
							, organisation = post.organization
							, event = post.eventSchedulerProfileResponseVO
							, options = options || {}
							;
							if (post.group != null) {
								DataProvider.resource.Group.inject(group);
							}else{
								DataProvider.resource.Organisation.inject(organisation);
							}
					

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
									if (post.group != null) {
						        		State.transitionTo('root.app.group-dashboard.groupEvents', {
						        			orgId: parseInt(post.organization.id),
						        			groupId: parseInt(post.group.id)
						        		});
						        	} else {
							        	State.transitionTo('root.app.org-dashboard.orgSchedule', {
							        		orgId: parseInt(post.organization.id)
							        	});
						        	}
								}
								deferred.resolve();
							})
							.catch(function() {
								deferred.reject();
							})
						;

						return deferred.promise;

					});

				


			}])
})();