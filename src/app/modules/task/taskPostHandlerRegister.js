/**
 * Created by sudhir on 1/12/15.
 */

;
(function () {
	"use strict";

	angular.module('app.modules')
		.run([
			'PostService', 'PostHandlerBaseService', 'APP_POST',
			'DataProvider', 'Connect',
			'mDialog', '$mdToast', 'blockUI', '$timeout', 'State', '$q', 'Lang','URL',
			function (PostService, PostHandlerBaseService, APP_POST
				, DataProvider, Connect
				, Dialog, $mdToast, blockUI, $timeout, State, $q, Lang,URL) {

				var LANG = Lang.data;
				PostService.registerPostHandler([
					APP_POST.TYPE.POST_NOTIFICATION_TASK_CREATED,
					APP_POST.TYPE.POST_NOTIFICATION_TASK_BLOCKED,
					APP_POST.TYPE.POST_NOTIFICATION_TASK_UN_BLOCKED,
					APP_POST.TYPE.POST_NOTIFICATION_TASK_LIFECYCLE_EVENT_START,
					APP_POST.TYPE.POST_NOTIFICATION_TASK_LIFECYCLE_EVENT_STOP,
					APP_POST.TYPE.POST_NOTIFICATION_TASK_LIFECYCLE_EVENT_RESUME,
					APP_POST.TYPE.POST_NOTIFICATION_TASK_LIFECYCLE_EVENT_FINISH,
					APP_POST.TYPE.POST_NOTIFICATION_TASK_LIFECYCLE_EVENT_CANCEL,
					APP_POST.TYPE.POST_NOTIFICATION_TASK_LIFECYCLE_EVENT_CLOSE,
					APP_POST.TYPE.POST_NOTIFICATION_TASK_ASSIGNMENT,
					APP_POST.TYPE.POST_NOTIFICATION_TASK_CONTRIBUTOR_INVITATION_REPLY_ACCEPT,
					APP_POST.TYPE.POST_NOTIFICATION_TASK_CONTRIBUTOR_INVITATION_REPLY_REJECT

				], function (post, options) {
					var deferred = $q.defer()
						, job = post.job
						, task = post.task;

					DataProvider.resource.Job.inject(job);
					DataProvider.resource.Task.inject(task);

					PostHandlerBaseService.showPostNotificationHandlerDialog({
							locals: {
								post: post,
								xtras: {
									//secText: "Task Info",
									priText: "Ok"
								}
							}
						}, {
							targetEvent: options.targetEvent
						})
						.then(function (res) {
							if (res == 'sec') {
								State.transitionTo('root.app.task-dashboard.taskProfile', {
									jobId: job.id,
									taskId: task.id
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
						APP_POST.TYPE.POST_TYPE_VAULT_TASK_FILE_UPLOAD_INVITEE,
						APP_POST.TYPE.POST_TYPE_VAULT_TASK_FILE_DELETE_INVITEE,
						APP_POST.TYPE.POST_TYPE_VAULT_TASK_FILE_RENAME_INVITEE
						//APP_POST.TYPE.POST_NOTIFICATION_JOB_VAULT_FILE_DEL,
						//APP_POST.TYPE.POST_NOTIFICATION_JOB_VAULT_FILE_RENAME
					],
					function (post, options) {
						var deferred = $q.defer()
							, task = post.task
							, options = options || {};

						//DataProvider.resource.Organisation.inject(org);
						//DataProvider.resource.Job.inject(job);

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
									State.transitionTo('root.app.task-dashboard.taskVault', {
										jobId: task.jobId,
										taskId: task.id
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
					APP_POST.TYPE.POST_NOTIFICATION_TASK_CONTRIBUTOR_INVITATION
				], HandleTaskContributorInvitationPost);

				function HandleTaskContributorInvitationPost(post, options) {
					var deferred = $q.defer();

					_showInvitationReplyDialog()
						.then(function (toAccept) {
							var result;
							if (toAccept == 'true') {
								result = true;
							} else {
								result = false;
							}
							
							blockUI.start('Sending reply');
							_sendReply(post, result)
								.then(function (res) {
									blockUI.stop();
									var respMessage = res && res.respMsg;
									if (respMessage)
										$mdToast.show($mdToast.simple()
											.content(respMessage)
											//.action('View Notifications')
											.position('bottom right')
											.hideDelay(4000));
									post.toggleRead(true, {bypassCache: false});
									deferred.resolve(res);
								})
								.catch(function (err) {
									blockUI.stop(err.respMsg, {
										status: 'isError',
										action: LANG.BUTTON.OK
									});
									deferred.reject(err);
								});
						});

					function _showInvitationReplyDialog() {
						return Dialog.show({
							targetEvent: options.targetEvent,
							locals: {
								task: post.task,
								post: post,
								LANG: LANG,
								title: post.$_notificationCategoryText,
								content: post.notificationDescription,
							},
							templateUrl: 'app/modules/posts/templates/taskContribInvitation.dialog.tpl.html',
							controller: ['$mdDialog', '$scope', 'locals',
								function ($mdDialog, $scope, locals) {
									angular.extend($scope, {
										locals: locals,
										navigateToTaskView: function () {
											State.transitionTo('root.app.task-dashboard.taskProfile', {
												jobId: locals.task.jobId,
												taskId: locals.task.id
											})
										},
										reply: function (toAccept) {
											$mdDialog.hide(toAccept);
										},
										cancel: function () {
											deferred.reject();
											$mdDialog.cancel();
										}
									})
								}]
						});
					}

					function _sendReply(post, toAccept) {
						return Connect.post(URL.REPLY_INVITE_FOR_TASK_CONTRIBUTOR, {
							postId: post.id,
							confirm: toAccept ? 0 : -1
						});
					}

					return deferred.promise;
				}

			}]);

})();