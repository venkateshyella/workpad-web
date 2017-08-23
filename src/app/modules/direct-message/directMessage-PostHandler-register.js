/**
 * Created by sudhir on 20/1/16.
 */

angular.module('app.modules')
	.run([
		'PostService', 'PostHandlerBaseService', 'APP_POST',
		'DirectMessaging',
		'mDialog', '$q', 'State',
		function (PostService, PostHandlerBaseService, APP_POST
			, DirectMessaging
			, Dialog, $q, State) {
			"use strict";

			PostService.registerPostHandler([
					APP_POST.TYPE.POST_NOTIFICATION_DM_RECEIPT
				],
				function (post, options) {
					var deferred = $q.defer()
						, postId = post.id
						, topicId = post.topicId
						, toUser = post.toUser
						, fromUser = post.fromUser
						;

					PostHandlerBaseService.showPostNotificationHandlerDialog({
							locals: {
								post: post,
								xtras: {
									secText: "Reply",
									priText: "Ok"
								}
							},
							targetEvent: options.targetEvent
						}, {
							skipPostAutoUpdate: true
						})
						.then(function (res) {
							if (res == 'sec') {
								DirectMessaging.runSendMessageWorkflow(topicId, fromUser.id, {
										fetchOlderTopicMessages: true
									})
									.then(function (res) {
										deferred.resolve(res);
										post.toggleRead(true);
										return res;
									})
									.catch(function (err) {
									})
								;
							} else {
								post.toggleRead(true)
									.then(function (res) {
										deferred.resolve(res);
									})
									.catch(function (err) {
										deferred.reject(err);
									})
								;
							}
						})
						.catch(function () {
							deferred.reject();
						})
					;

					return deferred.promise;

				})
		}
	])
;