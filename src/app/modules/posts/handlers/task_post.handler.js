/**
 * Created by sudhir on 22/9/15.
 */

;
(function () {
	"use strict";

	angular.module('app.modules')
		.service('TaskPostsHandler', ['$q', '$timeout',
			'DataProvider', 'State', 'AppCoreUtilityServices',
			'Connect', 'URL', 'mDialog', 'blockUI', 'Lang',
			TaskPostsHandler
		]);

	function TaskPostsHandler($q, $timeout
		, DataProvider, State, AppCoreUtilityServices
		, Connect, URL
		, Dialog, blockUI, Lang) {

		return {
			handle_taskLifecycleNotificationPost: taskLifecycleNotificationPost
		};

		function loadPostDetails(postId) {
			return DataProvider.resource.Post.find(postId, {bypassCache: true});
		}

		function taskLifecycleNotificationPost(post, options) {
			var task = post.task
				, job = post.job;
			if (task && task.id && job && job.id) {

				return State.transitionTo('root.app.task-dashboard.taskProfile', {
					jobId: task.jobId,
					taskId: task.id
				}).then(function () {
					"use strict";
					return DataProvider.resource.Post.find(post.id, {bypassCache: true})
				})
			} else {
				return Dialog.alert("Task data not found in the post.");
			}

		}
	}
})();