/**
 * Created by sudhir on 2/6/15.
 */


;
(function () {

	angular.module('app')
		.service('UserInvitationService', ['$q',
			'DataProvider', 'mDialog', 'blockUI',
			'Connect', 'URL', 'AppCoreUtilityServices',
			'Lang', 'APP_POST',
			UserInvitationService])
	;

	function UserInvitationService($q, DataProvider, Dialog, blockUI
		, Connect, URL, AppCoreUtilityServices
		, Lang, APP_POST) {

		var self = this,
			LANG = Lang.en.data
			;

		return {
			showPrepareInvitationDialog: showPrepareInvitationDialog,
			sendInvite: sendInvite,

			showInvitationDialog: showInvitationDialog,
			replyInvite: replyInvite,
			ejectUserFromOrg: ejectUserFromOrg,
			ejectUserFromGroup: ejectUserFromGroup
		};

		/**
		 * @doc service api
		 *
		 * @description
		 * Show the invitation dialog where user can prepare.
		 *
		 * @param userEntity
		 * @param options
		 */
		function showPrepareInvitationDialog(user, targetBundle, options) {
			options = options || {};
			var invitee = user;
			var group = targetBundle.group ? DataProvider.resource.Organisation.get(targetBundle.group.id) : null;
			var org = targetBundle.org ? DataProvider.resource.Organisation.get(targetBundle.org.id) : null;
			var toOrg = targetBundle.toOrg;
			var toGroup = targetBundle.toGroup;

			var deferred = $q.defer();

			Dialog.show({
				controller: ['$scope', '$mdDialog',
					function userInvitationDialogController($scope, $mdDialog) {

						$scope.inviteBundle = {
							invitee: invitee,
							org: org,
							group: group,
							toOrg: toOrg,
							toGroup: toGroup
						};

						$scope.isActionsEnabled = true;

						$scope.submit = function () {
							$scope.isActionsEnabled = false;
							blockUI.start(LANG.ORGANISATION.LOADING_MSG.SEND_INVITATION);
							sendInvite(invitee, toOrg, toGroup)
								.then(function (resp) {
									$mdDialog.hide(resp);
									Dialog.showAlert({
										content: resp.respMsg,
										ok: LANG.BUTTON.OK
									}).then(function () {
										deferred.resolve(resp);
									}).finally(function () {
										$scope.isActionsEnabled = true;
									});
								})
								.catch(function (error) {
									Dialog.showAlert({
										content: error.respMsg,
										ok: LANG.BUTTON.OK
									}).then(function () {
										//$mdDialog.hide(resp);
									});
								})
								.finally(function () {
									$scope.isActionsEnabled = true;
									blockUI.stop();
								});
						};

						$scope.cancel = function() {
							deferred.reject();
							$mdDialog.cancel();
						}

					}],

				templateUrl: 'app/modules/user-invite/templates/user-invite.dialog-full-screen.tpl.html',
				targetEvent: options.$event
			});

			return deferred.promise;
		}

		/**
		 * @doc service api
		 *
		 * @description
		 *
		 * Send invitation request inviting a user to join a organisation
		 * or a group in an organisation
		 *
		 * @param user {object} user entity object.
		 * @param org {object} organisation entity object.
		 * @param group {object} [optional] group entity object.
		 */
		function sendInvite(user, org, group) {
			var url = "";
			var request = {};
			if (!angular.isObject(org)) {
				throw "WorkSpace object not valid";
			} else if (!angular.isObject(user)) {
				throw "user object not valid";
			} else {
				url = URL.USER_INVITE_TO_ORG;
				if (angular.isObject(group)) {
					url = URL.USER_INVITE_TO_GROUP;
				}
			}

			if (angular.isObject(group)) {
				request = {
					orgId: org.id,
					userId: user.id,
					groupId: group.id
				}
			} else {
				request.data = [
					{
						orgId: org.id,
						userId: user.id
					}
				];
			}

			return Connect.post(url, request)
		}

		function showInvitationDialog(user, targetBundle, options) {
			"use strict";
			var options = options || {};
			var deferred = $q.defer();
			var bundle = angular.copy(targetBundle);
			var fetchInvitationDataBundleFn = targetBundle.fetchFn || noopDefer;
			var invitee = user
				, fromUser = targetBundle.fromUser
				, post = targetBundle.post
				;
			var locals = options.locals || {};
			locals.LANG = LANG;

			//var toOrg = DataProvider.resource.Organisation.get(targetBundle.org.id);

			var toOrg = targetBundle.org;
			var toGroup = targetBundle.group
					? DataProvider.resource.Group.get(targetBundle.group.id)
					: null
				;
			Dialog.show({
				controller: ['$scope', '$mdDialog',
					function replyInvitationDialogController($scope, $mdDialog) {
						$scope.bundle = bundle;
						$scope.post = angular.copy(post);
						$scope.post.display_createDate = AppCoreUtilityServices.getDisplayDateTime($scope.post.createDate);
						$scope.locals = locals;
						//console.log($scope.bundle);

						$scope.inviteBundle = {
							inviter: fromUser,
							invitee: invitee,
							toOrg: toOrg,
							toGroup: toGroup
						};

						$scope.asyncProcess = {};

						$scope.isActionsEnabled = true;

						$scope.submit = function (doAccept) {
							$scope.asyncProcess.submitAccept = doAccept;
							$scope.isActionsEnabled = false;
							replyInvite(bundle.post, doAccept)
								.then(function (resp) {
									Dialog.showAlert({
										content: resp.respMsg,
										ok: LANG.BUTTON.OK
									}).then(function () {
										$mdDialog.hide(resp);
										deferred.resolve();
									}).finally(function () {
										$scope.isActionsEnabled = true;
									});
									post.status = -2;
									DataProvider.resource.Post.inject(post)
								})
								.catch(function (error) {
									
									Dialog.showAlert({
										content: error.respMsg,
										ok: LANG.BUTTON.OK
									}).then(function () {
										//$mdDialog.hide(resp);
										deferred.reject(error);
									});
									
								})
								.finally(function () {
									$scope.isActionsEnabled = true;
								});
						};

						$scope.cancel = $mdDialog.cancel;

						fetchInvitationDataBundleFn().then(function (updatedBundle) {
							if (updatedBundle) {
								angular.extend($scope.bundle, updatedBundle);
							}
						}).catch(function (error) {
							$scope.isActionsEnabled = true;
						})

					}],
				templateUrl: bundle.invitationDialogTemplateUrl,
				targetEvent: options.$event
			});

			return deferred.promise;
		}

		/**
		 * @name replyInvite
		 * @desc send reply to the an invitation request to join
		 *       an organisation or a group.
		 * @param invitePost {Object} Post object
		 * @param doAccept {Boolean} Response boolean.
		 *        true: for Accepting
		 *        false: for Rejecting
		 */
		function replyInvite(invitePost, doAccept) {
			"use strict";
			var url,
				responseData = {
					postId: invitePost.id,
					confirm: doAccept ? 0 : -1
				}
				;

			switch (invitePost.postType) {
				case APP_POST.TYPE.POST_INVITATION_TO_GROUP_NOTIFY_INVITEE:
					url = URL.REPLY_INVITE_TO_GRP;
					break;

				case APP_POST.TYPE.POST_INVITATION_TO_ORGANISATION_NOTIFY_INVITEE:
					url = URL.REPLY_INVITE_TO_ORG;
					break;

				case APP_POST.TYPE.POST_INVITATION_JOIN_JOB:
					url = URL.REPLY_INVITE_TO_JOB;
					break;
				case APP_POST.TYPE.POST_TYPE_EVENT_REMAINDER_NOTIFICATION:
					url = URL.REPLY_INVITE_TO_EVENT;
					break;

				default:
					throw "invalid post type";
			}

			return Connect.post(url, responseData);

		}

		function ejectUserFromOrg(user, org) {
			"use strict";
			var url = URL.EJECT_USER_FROM_ORG;
			var reqData = {
				id: org.id,
				userId: user.id
			};
			return Connect.post(url, reqData);
		}

		function ejectUserFromGroup(user, intent) {
			"use strict";
			var url = URL.EJECT_USER_FROM_GRP;
			var group = intent.group
				, org = intent.org
				;
			var reqData = {
				id: group.id,
				userId: user.id
			};
			return Connect.post(url, reqData)
		}

		function noopDefer() {
			var deferred = $q.defer();
			deferred.resolve();
			return deferred.promise;
		};

	}


})();