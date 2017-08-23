/**
 * Created by sudhir on 22/9/15.
 */

;
(function () {
	"use strict";

	angular.module('app.modules')
		.service('JobPostsHandler', ['$q', '$timeout',
			'DataProvider', 'State', 'AppCoreUtilityServices',
			'Connect', 'URL', 'mDialog', 'blockUI', 'Lang',
			JobPostsHandler
		]);

	function JobPostsHandler($q, $timeout
		, DataProvider, State, AppCoreUtilityServices
		, Connect, URL
		, Dialog, blockUI, Lang) {

		return {
			handle_jobAdvertisementPost: jobAdvertisementPost,
			handle_jobLifecycleNotificationPost: jobLifecycleNotificationPost
		};

		function jobAdvertisementPost(post, options) {
			var deferred = $q.defer();

			var LANG = Lang.en.data
				, job = DataProvider.resource.Job.get(post.job.id) || post.job
				, organization = post.organization
				, group = post.group
				;

			blockUI.start(LANG.POST.DEFAULT.LOADING_POST_DATA);
			loadPostDetails(post.id)
				.then(function () {
					blockUI.stop();
					//job = post.job;

					post.fromUser.displayImage =

						Dialog.show({
							targetEvent: options.targetEvent,
							templateUrl: 'app/modules/posts/templates/jobAdvertisement.dialog.tpl.html',
							locals: {
								Utils: AppCoreUtilityServices,
								post: post,
								content: post.notificationDescription,
								ok: LANG.BUTTON.ACCEPT,
								cancel: LANG.BUTTON.REJECT,
								LANG: LANG,
								org: organization,
								group: group,
								job: job,
								action: {
									viewJobDetails: function() {
										State.transitionTo('root.app.job-view.jobProfile', {
											jobId: job.id
										})
									},
									getNotificationCategory : function(NotifigationCategory){
                       var NotificationCategoryList = {
                           POST_NOTIFICATION_CATEGORY_INFORMATION : -1,
                           POST_NOTIFICATION_CATEGORY_ACTION :-2,
                           POST_NOTIFICATION_CATEGORY_SPONSOR :-3
                       };  
										switch (NotifigationCategory) {
									    case NotificationCategoryList.POST_NOTIFICATION_CATEGORY_INFORMATION:
										    return "Information";
										    break;
									    case NotificationCategoryList.POST_NOTIFICATION_CATEGORY_ACTION:
										    return "Action";
										    break;
									    case NotificationCategoryList.POST_NOTIFICATION_CATEGORY_SPONSOR:
										    return "Sponser";
										    break;
									    default:
										    return "";
							    	}
									}
								}
							}
						})
							.then(function (res) {
								
								var toAccept;
								
								if (res == 'true') {
									toAccept = true;	
								} else {
									toAccept = false;
								}
								
								var response = null;
								blockUI.start(LANG.POST.JOB_INVITATION.SENDING_REPLY);
								sendApprovalResponse(post, toAccept)
									.then(function (res) {
                     /* After sending confirm call, remove/updating post from Post store */
                     DataProvider.resource.Post.eject(post.id);

										response = res;
										deferred.resolve(res);


									})
									.catch(function (err) {
										response = err;
										deferred.reject(err);
									})
									.finally(function () {
										blockUI.stop(response.respMsg, {
											status: response.isSuccess ? 'isSuccess' : 'isError'
										})
									})
								;
							})
							.catch(function () {
								deferred.resolve();
							})
					;
				})
				.catch(function (err) {
					blockUI.stop(err.respMsg, {
						status: 'isError',
						action: "Ok"
					});
				})
			;

			return deferred.promise;

			function sendApprovalResponse(post, toAccept) {
				return Connect.post(URL.REPLY_ADVERTISEMENT_FOR_JOB, {
					postId: post.id,
					confirm: toAccept ? 0 : -1
				});
				//return $timeout(null, 4000);
			}
		}

		function loadPostDetails(postId) {
			return DataProvider.resource.Post.find(postId, {bypassCache: true});
		}

		function jobLifecycleNotificationPost(post, options) {
			var job = post.job
				, org = post.organization;
			if (job && job.id && org && org.id) {
				return State.transitionTo('root.app.job-view.jobProfile', {
					jobId: job.id
				}).then(function () {
					"use strict";
					return DataProvider.resource.Post.find(post.id, {bypassCache: true})
				})
			} else {
				return Dialog.alert("Job data not found in the post.");
			}

		}
	}

})();