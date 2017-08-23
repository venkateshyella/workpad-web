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
			'mDialog', 'State', '$q',
			function (PostService, PostHandlerBaseService, APP_POST
				, DataProvider
				, Dialog, State, $q) {

				PostService.registerPostHandler([
						APP_POST.TYPE.POST_NOTIFICATION_JOB_DELEGATOR_REPLY_ACCEPT,
						APP_POST.TYPE.POST_NOTIFICATION_JOB_DELEGATOR_REPLY_REJECT,

						APP_POST.TYPE.POST_NOTIFICATION_JOB_ADVERTISEMENT_REPLY_ACCEPT,
						APP_POST.TYPE.POST_NOTIFICATION_JOB_ADVERTISEMENT_REPLY_REJECT,
						APP_POST.TYPE.POST_NOTIFICATION_JOB_OWNER_REMOVAL


					],
					function (post, options) {
						var deferred = $q.defer()
							, job = post.job
							, organisation = post.organization
							;

						DataProvider.resource.Job.inject(job);
						organisation && (DataProvider.resource.Organisation.inject(organisation));

						PostHandlerBaseService.showPostNotificationHandlerDialog({
							locals: {
								post: post,
								xtras: {
									//secText: "Job Members",
									priText: "Ok"
								}
							},
							targetEvent: options.targetEvent
						})
							.then(function (res) {
								if (res == 'sec') {
									State.transitionTo('root.app.job-view.jobMembers', {
										jobId: job.id
									})
								}
								deferred.resolve(res);
							})
							.catch(function () {
								deferred.reject();
							});

						return deferred.promise;
					});

				PostService.registerPostHandler([
					APP_POST.TYPE.POST_NOTIFICATION_JOB_LIFECYCLE_EVENT_START,
					APP_POST.TYPE.POST_NOTIFICATION_JOB_LIFECYCLE_EVENT_STOP,
					APP_POST.TYPE.POST_NOTIFICATION_JOB_LIFECYCLE_EVENT_RESUME,
					APP_POST.TYPE.POST_NOTIFICATION_JOB_LIFECYCLE_EVENT_FINISH,
					APP_POST.TYPE.POST_NOTIFICATION_JOB_LIFECYCLE_EVENT_REJECT,
					APP_POST.TYPE.POST_NOTIFICATION_JOB_LIFECYCLE_EVENT_CANCEL,
					APP_POST.TYPE.POST_NOTIFICATION_JOB_LIFECYCLE_EVENT_CLOSE,
					APP_POST.TYPE.POST_NOTIFICATION_JOB_FINISH_PERCENTAGE,
					APP_POST.TYPE.POST_TYPE_AUTOMATION_JOB_SUCCESS_NOTIFICATION
				], function (post, options) {
					var deferred = $q.defer()
						, job = post.job
						, org = post.organization;

					DataProvider.resource.Organisation.inject(org);
					DataProvider.resource.Job.inject(job);

					PostHandlerBaseService.showPostNotificationHandlerDialog({
						locals: {
							post: post,
							xtras: {
								//secText: "Job Dashboard",
								priText: "Ok"
							}
						},
						targetEvent: options.targetEvent
					})
						.then(function (res) {
							if (res == 'sec') {
								State.transitionTo('root.app.job-view.jobProfile', {
									jobId: job.id
								})
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
					APP_POST.TYPE.POST_NOTIFICATION_JOB_VAULT_FILE_ADD,
					APP_POST.TYPE.POST_NOTIFICATION_JOB_VAULT_FILE_DEL,
					APP_POST.TYPE.POST_NOTIFICATION_JOB_VAULT_FILE_RENAME
				], function (post, options) {
					var deferred = $q.defer()
						, job = post.job
						, org = post.organization
						, options = options || {};

					DataProvider.resource.Organisation.inject(org);
					DataProvider.resource.Job.inject(job);

					PostHandlerBaseService.showPostNotificationHandlerDialog({
						locals: {
							post: post,
							xtras: {
								//secText: "Job Dashboard",
								priText: "Ok"
							}
						},
						targetEvent: options.targetEvent
					})
						.then(function (res) {
							if (res == 'sec') {
								State.transitionTo('root.app.job-view.jobVault', {
									jobId: job.id
								})
							}
							deferred.resolve();
						})
						.catch(function () {
							deferred.reject();
						});

					return deferred.promise;
				});
				
				PostService.registerPostHandler([
					APP_POST.TYPE.POST_TYPE_JOB_TIMESHEET_REMAINDER_NOTIFICATION
				], function (post, options) {
					var deferred = $q.defer()
						, job = post.job
						, org = post.organization
						, options = options || {};

					/*DataProvider.resource.Organisation.inject(org);
					DataProvider.resource.Job.inject(job);*/

					PostHandlerBaseService.showPostNotificationHandlerDialog({
						locals: {
							post: post,
							xtras: {
								//secText: "Job Dashboard",
								priText: "Ok"
							}
						},
						targetEvent: options.targetEvent
					})
						.then(function (res) {
							if (res == 'sec') {
								State.transitionTo('root.app.job-list.pendingTimesheetJobList', {
									type: 2
								});
							}
							deferred.resolve();
						})
						.catch(function () {
							deferred.reject();
						});

					return deferred.promise;
				});
				
				PostService.registerPostHandler([
					APP_POST.TYPE.POST_TYPE_JOB_REVIEW_RATE_REMAINDER_NOTIFICATION
				], function (post, options) {
					var deferred = $q.defer()
						, job = post.job
						, org = post.organization
						, options = options || {};

					DataProvider.resource.Organisation.inject(org);
					DataProvider.resource.Job.inject(job);

					PostHandlerBaseService.showPostNotificationHandlerDialog({
						locals: {
							post: post,
							xtras: {
								//secText: "Job Dashboard",
								priText: "Ok"
							}
						},
						targetEvent: options.targetEvent
					})
						.then(function (res) {
							if (res == 'sec') {
								State.transitionTo('root.app.job-list.pendingRatingJobList');
							}
							deferred.resolve();
						})
						.catch(function () {
							deferred.reject();
						});

					return deferred.promise;
				})
			}])

})();