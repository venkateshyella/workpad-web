/**
 * Created by sudhir on 21/1/16.
 */

angular.module('app')
	.service('JobRating', [
		'$q', '$timeout', 'mDialog', 'blockUI', 'Lang',
		function ($q, $timeout, Dialog, blockUI, Lang) {
			"use strict";

			var LANG = Lang.en.data;
			var defaultDialogConfig = {};

			return {
				runEditRatingWorkflow: runEditRatingWorkflow
			};

			function runEditRatingWorkflow(jobModel, dialogConfig, params) {
				var deferred = $q.defer()
					, _config = angular.extend({}, defaultDialogConfig, dialogConfig)
					, _params = angular.extend({}, params, {
						BUTTON: LANG.BUTTON
					})
					, jobMembers = []
					;

				blockUI.start();

				jobModel.findJobMembersToRate()
					.then(function (users) {
						if (!users || users.length <= 0) {
							blockUI.stop(LANG.JOB.MESSAGES.UNRATED_USERS_NOT_FOUND, {
								status: 'isError',
								action: LANG.BUTTON.OK
							});
							deferred.reject();
							return deferred.promise;
						}
						else {
							blockUI.stop();
						}
						jobMembers = users;
						_.each(jobMembers, function (user) {
							user.ratingVal = 0;
						});

						startRatingEditor(_config);
					})
					.catch(function (err) {
						err && err.respMsg &&
						blockUI.stop(err.respMsg, {
							status: 'isError',
							action: LANG.BUTTON.OK
						});
						deferred.reject(err);
					});

				return deferred.promise;

				/**
				 * Submit Users ratings for a job.
				 * User rating data format
				 * {
				 *   id: <Id of the user>,
				 *   overallRating: <Overall skill of the user>,
				 *   skills: [
				 *     {
				 *       id: Skill id,
				 *       rating: Rating metric {x|x∈Z, 0 ≤ x ≤ 5}
				 *     }
				 *   ]
				 * }
				 *
				 * @param jobMembersRatings
				 * @returns {*}
				 */
				function submitRating(jobMembersRatings) {
					blockUI.start("Submitting ratings");

					var ratingsParam = [];
					_.each(jobMembersRatings, function (userRatingObj) {
						var perfRating = userRatingObj.ratingVal
							, skillsRatings = userRatingObj.skills
							;

						var userRatingParams = {
							id: userRatingObj.id,
							overallRating: perfRating || 0,
							skills: []
						};

						_.each(skillsRatings, function (skillRating) {
							userRatingParams.skills.push({
								id: skillRating.id,
								rating: skillRating.ratingVal || 0
							})
						});

						ratingsParam.push(userRatingParams);
					});

					return jobModel.submitUserRating(ratingsParam)
						.then(function (res) {
							blockUI.stop(res.respMsg, {
								status: 'isSuccess',
								action: LANG.BUTTON.OK
							});
							deferred.resolve(res);
						})
						.catch(function (err) {
							blockUI.stop(err.respMsg, {
								status: 'isError',
								action: LANG.BUTTON.OK
							});
							deferred.reject(err);
						});
				}

				function startRatingEditor(ratingEditorDialogConfig) {
					return Dialog.show(angular.extend(ratingEditorDialogConfig,
						{
							templateUrl: "app/modules/job/templates/job-editRating-submit.dialog.html",
							clickOutsideToClose: false,
							controller: ['$scope', '$mdDialog',
								EditUserSkillRatingDialogController]
						}))
						.then(function (event) {
							var action = event.action;
							switch (action) {
								case 'action.jobRatingWorkflow.confirmIncompleteRatingSubmission':
									Dialog.confirm({
											title: 'Ratings Submission',
											content: 'You have not rated all the members in the job. Do you wish to submit your ratings?',
											ok: LANG.BUTTON.SUBMIT,
											cancel: "Continue Rating"
										})
										.then(function () {
											submitRating(jobMembers);
										})
										.catch(function () {
											startRatingEditor(ratingEditorDialogConfig);
										})
									;
									break;
								case 'action.jobRatingWorkflow.confirmRatingSubmission':
									submitRating(jobMembers);
									break;
							}
						})
						;
				}

				function EditUserSkillRatingDialogController($scope, $mdDialog) {
					angular.extend($scope, _params, {
						cancel: $mdDialog.cancel,
						submit: function () {
							if (_checkUnratedMembers()) {
								$mdDialog.hide({
									action: 'action.jobRatingWorkflow.confirmIncompleteRatingSubmission'
								})
							} else {
								$mdDialog.hide({
									action: 'action.jobRatingWorkflow.confirmRatingSubmission'
								})
							}
						},
						onRatingChange: function () {
						}
					}, {
						jobMembers: jobMembers
					});

					function _checkUnratedMembers() {
						return _.where(jobMembers, {ratingVal: 0}).length > 0
					}
				}

			}

		}
	])
;