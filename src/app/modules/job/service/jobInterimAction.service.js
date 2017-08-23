/**
 * Created by sudhir on 17/9/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.service('JobInterimAction', [
			'JobAdvertisement', 'JobAdvertisementFactory',
			'$q', '$timeout', 'mDialog', 'blockUI',
			'Connect', 'URL', 'Lang',
			'JOB_LIFECYCLE_EVENT', 'DataProvider',
			JobInterimActionService
		])
	;

	function JobInterimActionService(JobAdvertisement, JobAdvertisementFactory
		, $q, $timeout, Dialog, blockUI, Connect, URL, Lang
		, JOB_LIFECYCLE_EVENT, DataProvider) {

		var LANG = Lang.en.data;
		return {
			createNewAdvertisement: createNewAdvertisement,
			showJobLifecycleEventTriggerDialog: showJobLifecycleEventTriggerDialog,
			showFormSubmitDialog: showFormSubmitDialog,
			showAddFormDialog: showAddFormDialog
		};

		function showAddFormDialog(job, template, options) {
			var dialogOptions = {
					templateUrl: 'app/modules/job/templates/job-form-add.dialog.tpl.html',
					clickOutsideToClose:false,
					controller: ['$scope', '$mdDialog', 'Lang', 'job', 'template',
						AddFormToJobDialogController],
					controllerAs: 'jobFormCreateCtrl',
					locals: {
						job: job,
						template: template
					}
				}
				;

			return Dialog.show(dialogOptions);

			function AddFormToJobDialogController($scope, $mdDialog, Lang, job, template) {
				var self = this
					, templateId = template.templateId
					;

				self.cancel = $mdDialog.cancel;
				self.confirm = $mdDialog.hide;
				self.sendAddFormRequest = sendAddFormRequest;
				self.jobLifecycleEvents = _.invert(JOB_LIFECYCLE_EVENT);

				$scope.ui = {
					isObjectiveExpanded: false,
					isTemplateDescExpanded: false
				};
				$scope.form = {};
				$scope.lifecycleEvent = null;
				$scope.jobModel = job;
				$scope.template = template;

				console.log(template);

				self.LANG = Lang.en.data;

				function sendAddFormRequest(lifecycleEvent) {
					blockUI.start('Adding new form..');
					console.log(lifecycleEvent);
					job.addNewForm(templateId, {
							name: template.name,
							event: JOB_LIFECYCLE_EVENT[lifecycleEvent]
						})
						.then(function (res) {
							blockUI.stop(res.respMsg, {
								status: 'isSuccess'
							});
							$mdDialog.hide(res);
						})
						.catch(function (err) {
							blockUI.stop(err.respMsg, {
								status: 'isError',
								action: 'Ok'
							});
						})
				}
			}
		}

		function showFormSubmitDialog(form) {
			var dialogOptions = {
				locals: {
					form: form
				},
				templateUrl: 'app/modules/form/templates/form-submit.dialog.tpl.html',
				clickOutsideToClose:false,
				controller: ['$scope', '$mdDialog', '$timeout', 'DataProvider', 'form',
					FormSubmitDialogController],
				controllerAs: 'formSubmitCtrl'
			};

			Dialog.show(dialogOptions);

			function FormSubmitDialogController($scope, $mdDialog, $timeout, DataProvider, form) {
				$scope.cancel = $mdDialog.cancel;

				$scope.formError = null;
				$scope.isFormValid = isFormValid;

				$scope.submit = function submitForm() {
					var formValidationResult = form.validate();

					if (formValidationResult.length > 0) {
						// Form has errors.
						return;
					}
					blockUI.start('submitting form');
					form.submit()
						.then(function (res) {
							console.log(res);
							blockUI.stop(res.respMsg, {
								status: 'isSuccess'
							});
							$mdDialog.hide();
						})
						.catch(function (err) {
							blockUI.stop(err.respMsg, {
								status: 'isError',
								action: 'Ok'
							})
						})
					;

					function _submitFormData() {
						var deferred = $q.defer();
						var formJSON = form.toJSON({filter: 'submit'});
						Connect.post(URL.JOB_FORM_SUBMIT, formJSON)
							.then(function (res) {
								deferred[res.iSuccess ? 'resolve' : 'reject'](res);
							})
							.catch(function (err) {
								deferred.reject(err);
							})
						;
						return deferred.promise;
					}
				};

				DataProvider.resource.Form.find(form.formId, {
						bypassCache: true
					})
					.then(function (res) {
						isFormValid();
						$scope.formModel = DataProvider.resource.Form.get(form.formId);
						$timeout(angular.noop);
					})
					.catch(function (err) {
						console.log(err);
					})
				;

				function isFormValid() {
					if (!form || !form.validate) return false;
					var formValidationResult = form.validate();
					if (formValidationResult.length > 0) {
						$scope.formError = formValidationResult;
						return false;
					} else {
						$scope.formError = [];
						return true;
					}
				}
			}
		}

		function showJobLifecycleEventTriggerDialog(jobModel, event) {

			return Dialog.show({
				controller: ['$scope', '$mdDialog', '$mdToast'
					, 'State', 'Lang', 'jobModel', 'lifecycleEvent'
					, 'JOB_LIFECYCLE_EVENT',
					JobStatusChangeDialogController],
				templateUrl: 'app/modules/job/templates/job-event-trigger.dialog.tpl.html',
				locals: {
					jobModel: jobModel,
					lifecycleEvent: event
				},
				clickOutsideToClose: false
			});

			function JobStatusChangeDialogController($scope, $mdDialog, $mdToast
				, State, Lang, jobModel, lifecycleEvent
				, JOB_LIFECYCLE_EVENT) {
				$scope.LANG = Lang.en.data;
				$scope.JOB_LIFECYCLE_EVENT = JOB_LIFECYCLE_EVENT;
				$scope.lifecycleEvent = lifecycleEvent;
				$scope.jobModel = jobModel;
				$scope.form = {};
				$scope.formModel = {};
				$scope.formModel.jobStatusChange = {};

				$scope.flag = {
					isFetchingForms: false,
					isLifeCycleUpdateInProgress: false
				};
				$scope.fetchError = null;

				$scope.isMandatory = (lifecycleEvent == "TRY_FINISH");
				$scope.showFormSubmissionDialog = function showFormSubmissionDialog(formModel) {
					showFormSubmitDialog(formModel);
				};
				$scope.getUnsubmittedForms = getUnsubmittedForms;

				$scope.cancel = function () {
					$mdDialog.hide();
				};
				$scope.submit = function submit() {
					var comment = $scope.formModel.comment;

					blockUI.start('Updating Job..');
					$scope.flag.isLifeCycleUpdateInProgress = true;
					$scope.jobModel[lifecycleEvent.toLocaleLowerCase()](comment)
						.then(function (res) {
							$mdDialog.hide(res);
							blockUI.stop();
							var toast = $mdToast.simple()
								.content(res.respMsg)
								.position('bottom right')
								.hideDelay(4000);
							$mdToast.show(toast)
								.then(function (res) {
								})
						})
						.catch(function (err) {
							blockUI.stop(err.respMsg, {
								status: 'isError',
								action: LANG.BUTTON.OK
							});
							$mdDialog.hide(err);
						})
						.finally(function () {
							$scope.flag.isLifeCycleUpdateInProgress = false;
						});
				};
				$scope.isOkToSubmit = function () {
					return !$scope.flag.isLifeCycleUpdateInProgress
						&& $scope.form.jobStatusChange.$valid
						&& (
							jobModel.countFormsByFilter({
								isSubmitted: false,
								triggerCode: JOB_LIFECYCLE_EVENT[lifecycleEvent]
							}) == 0
						)
						&& !$scope.flag.isFetchingForms
						&& !$scope.flag.status_formFetchFail
						;
				};
				$scope.fetchForms = _fetchForms;

				_fetchForms();

				function _fetchForms() {
					$scope.flag.isFetchingForms = true;
					$scope.flag.status_formFetchFail = false;
					return jobModel.loadForms()
						.then(function (res) {
							$scope.flag.status_formFetchFail = false;
						})
						.catch(function (err) {
							$scope.flag.status_formFetchFail = true;
							$scope.fetchError = err.respMsg;
						})
						.finally(function () {
							$scope.flag.isFetchingForms = false;
						})
						;
				}

				function getUnsubmittedForms() {
					return $scope.jobModel.getFormsByFilter({
						triggerCode: JOB_LIFECYCLE_EVENT[lifecycleEvent],
						isSubmitted: 0
					});
				}
			}

		}

		function createNewAdvertisement(job, options) {
			var options = options || {};
			return Dialog.show({
				templateUrl: 'app/modules/job/templates/job-advertisement-v2-create.dialog.tpl.html',
				clickOutsideToClose:false,
				targetEvent: options.$event,
				controller: [
					'$scope', '$controller', '$mdDialog', 'blockUI',
					function ($scope, $controller, $mdDialog, blockUI) {

						var self = this
							, newJobAdv = new JobAdvertisementFactory.GroupAdvertisement(job)
							, jobAdvertisementOrg = job.organization
							, groupsMeta = {}
							;
						self.org = jobAdvertisementOrg;
						self.job = job;
						self.searchMode = 'group';

						getPendingJobAdvertisements($scope, job);
						$scope.LANG = LANG;
						$scope.cancel = function () {
							$mdDialog.cancel();
						};

						$scope.submit = function () {
							sendAdvertisement()
								.then(function (res) {
									//$mdDialog.hide(res);
								})
								.catch(function () {
								})
								.finally(function () {
								})
							;
						};
						$scope.removeGroup = removeAdvGroup;
						$scope.removeOrg = removeOrg;
						$scope.toggleSelectAllOrgMembers = toggleSelectAllOrgMembers;
						$scope.toggleOrgMembersList = toggleOrgMembersList;
						$scope.toggleGroupMembersList = toggleGroupMembersList;
						$scope.toggleAdvOrgMember = toggleAdvOrgMember;
						$scope.removeMemberFromAdvertisement = removeMemberFromAdvertisement;
						$scope.toggleAdvGroupMembersList = toggleAdvGroupMembersList;
						$scope.toggleAdvGroupSelectAll = toggleAdvGroupSelectAll;
						$scope.toggleGroupInvitee = toggleGroupInvitee;
						$scope.toggleAdvGroupMember = toggleAdvGroupMember;
						$scope.getUserModel = function (userId) {
							return DataProvider.resource.User.get(userId);
						};

						$scope.jobAdv = newJobAdv;
						$scope.formModel = {
							inviteMsg: ""
						};

						$scope.getModel = {
							User: DataProvider.resource.User.get,
							Group: DataProvider.resource.Group.get,
							Org: DataProvider.resource.Organisation.get
						};

						function removeMemberFromAdvertisement(userId) {
							newJobAdv.removeMember(userId);
							console.log(newJobAdv.getSavedData());
						}

						function addNewGroupMemberForAdvertisement(advUserObj) {
							//$scope.selectedMembers.push(advUserObj);
							//$scope.selectedMembers = _.unique($scope.selectedMembers, function (advObj) {
							//	return advObj.user.id + "-" + advObj.group.id
							//});

							var group = advUserObj.group
								, groupId = group.id
								, user = advUserObj.user
								;

							groupsMeta[groupId] = groupsMeta[groupId] || {};
							var groupMeta = groupsMeta[groupId];
							groupMeta._isMembersListExpanded = true;
							DataProvider.resource.Group.inject(group);
							DataProvider.resource.User.inject(user);
							var existingInviteesId = _.pluck(groupMeta.users, 'id');
							existingInviteesId.push(user.id);
							existingInviteesId = _.unique(existingInviteesId);
							groupMeta.users = DataProvider.resource.User.filter({
								where: {
									id: {
										in: existingInviteesId
									}
								}
							});
							newJobAdv.addGroupMember(advUserObj.group.id, advUserObj.user.id);
						}

						$scope.groupSearchCtrl = {
							selection: null,
							searchText: "",
							selectedItemChange: function (item) {
								if (item) {
									addNewSearchResult(item);
									console.log($scope.jobAdv);
								}
								$timeout(function () {
									$scope.groupSearchCtrl.searchText = "";
								}, 200)
							},
							querySearch: function (queryStr) {
								if (queryStr && queryStr.length > 0) {
									return newJobAdv.queryAdvertisementInvitees({
											queryStr: queryStr
										})
										.then(function (res) {
											var groups = prepareGroupQueryResult(res.groups);
											var orgs = prepareOrgQueryResult(res.orgs);
											var result = [].concat(orgs, groups);
											console.log(result);
											return result;
										})
										.catch(function () {
											return null;
										})
										;
								} else {
									return [];
								}

								function prepareOrgQueryResult(orgs) {
									var searchResults = _.map(orgs, function (orgSearchResult) {
										return {
											displayText: orgSearchResult.orgName,
											val: orgSearchResult,
											type: 'ORG'
										}
									});
									return searchResults;
								}

								function prepareGroupQueryResult(groups) {
									_.remove(groups, function (group) {
										var resultGroup = group;
										return (_.findIndex($scope.selectedGroups, function (advGroup) {
											return resultGroup.groupId == advGroup.groupId;
										}) != -1);
									});
									var searchResults = _.map(groups, function (group) {
										return {
											displayText: group.groupName,
											val: group,
											type: "GRP"
										};
									});
									return searchResults
								}
							}
						};

						function addNewSearchResult(result) {
							switch (result.type) {
								case 'GRP':
									var group = result.val;
									newJobAdv.addGroup(group.groupId);
									newJobAdv.addSendToAllFlag(group.groupId);
									break;
								case 'ORG':
									var org = result.val;
									newJobAdv.addOrg(org.orgId);
									newJobAdv.setOrgSendToAll(org.orgId, true);
									break;
							}
						}

						function removeOrg(orgId) {
							$scope.jobAdv.removeOrg(orgId);
						}

						function toggleSelectAllOrgMembers(orgId) {
							var advOrgMembers = $scope.jobAdv.getOrgExtras(orgId).users;
							if ($scope.jobAdv.getOrgSendToAll(orgId)) {
								$scope.jobAdv.setOrgSendToAll(orgId, false);
								$scope.jobAdv.removeAllOrgMembers(orgId);
							} else {
								$scope.jobAdv.setOrgSendToAll(orgId, true);
								$scope.jobAdv.addAllOrgMembers(orgId, _.pluck(advOrgMembers, 'id'));
							}
							//$scope.jobAdv.setOrgSendToAll(orgId, !$scope.jobAdv.getOrgSendToAll(orgId));
						}

						function toggleOrgMembersList(orgId) {
							var orgExtras = $scope.jobAdv.getOrgExtras(orgId) || {};
							$scope.jobAdv.setOrgExtras(orgId, {
								flag_expanded: !orgExtras.flag_expanded
							});
							_loadOrgInvitees(orgId)
								.then(function (users) {
									$scope.jobAdv.setOrgExtras(orgId, {
										users: users
									});
								})
						}
						function toggleGroupMembersList(groupId) {
							var groupExtras = $scope.jobAdv.getGroupExtras(groupId) || {};
							$scope.jobAdv.setGroupExtras(groupId, {
								flag_expanded: !groupExtras.flag_expanded
							});
							_loadGroupInvitees(groupId)
								.then(function (users) {
									$scope.jobAdv.setGroupExtras(groupId, {
										users: users
									});
								})
						}



						function toggleAdvOrgMember(orgId, userId) {
							if ($scope.jobAdv.getOrgMember(orgId, userId)) {
								$scope.jobAdv.removeOrgMember(orgId, userId);
							}
							else {
								$scope.jobAdv.addOrgMember(orgId, userId);
							}
							_updateOrgSendToAllFlag(orgId);
						}

						function _updateOrgSendToAllFlag(orgId) {
							try {
								var orgInvitees = $scope.jobAdv.getOrgExtras(orgId).users;
								var selectedOrgInvitees = $scope.jobAdv.getOrg(orgId).invitee;
								if (orgInvitees.length == selectedOrgInvitees.length) {
									$scope.jobAdv.setOrgSendToAll(orgId, true);
								} else {
									$scope.jobAdv.setOrgSendToAll(orgId, false);
								}
							} catch (e) {

							}
						}

						function removeAdvGroup(groupId) {
							if (!groupId) return;
							newJobAdv.removeGroup(groupId);
						}

						function toggleAdvGroupMember(groupId, userId) {




							var advData = $scope.jobAdv.getSavedData();
							if (advData.groups[groupId].invitee.indexOf(userId) > -1) {
								newJobAdv.removeGroupMember(groupId, userId);
							}
							else {
								newJobAdv.addGroupMember(groupId, userId);
							}
							_updateGroupSendToAllFlag(groupId);
						}
						function _updateGroupSendToAllFlag(groupId) {
							try {
								var groupInvitees = $scope.jobAdv.getGroupExtras(groupId).users;
								var selectedGroupInvitees = $scope.jobAdv.getGroup(groupId).invitee;
								if (groupInvitees.length == selectedGroupInvitees.length) {
									$scope.jobAdv.setGroupSendToAll(groupId, true);
								} else {
									$scope.jobAdv.setGroupSendToAll(groupId, false);
								}
							} catch (e) {

							}
						}

						function toggleAdvGroupMembersList(groupId, isOpen) {


              var groupExtras = $scope.jobAdv.getGroupExtras(groupId) || {};
							$scope.jobAdv.setGroupExtras(groupId, {
								flag_expanded: !groupExtras.flag_expanded
							});

							/* Create empty extras obj */
							//$scope.jobAdv.setGroupExtras(groupId, {});
							var group = $scope.jobAdv.getGroupExtras(groupId);
							group._isMembersListExpanded = !group._isMembersListExpanded;
							if (group._isLoadingMembersList) return;
							group._isLoadingMembersList = true;
							group._isMemberListLoadError = false;
							return _loadGroupInvitees(groupId)
								.then(function (groupMembers) {
									for (var i = 0; i < group.users.length; i++) {
										group.users[i].isInvited = false;
										newJobAdv.addGroupMember(groupId, group.users[i].id);
									}
								})
								.catch(function () {
									group._isMemberListLoadError = true;
									group.users = [];
								})
								.finally(function () {
									group._isLoadingMembersList = false;
								})
								;

							//if (group._isMembersListExpanded && !group._isMembersListAvailable) {
							//	group._isLoadingMembersList = true;
							//	// fetch group members list..
							//	group._isMemberListLoadError = false;
							//	newJobAdv.getAdvGroupMembers(groupId)
							//		.then(function (groupMembers) {
							//			console.log(groupMembers);
							//			group._isMembersListAvailable = true;
							//			group._isLoadingMembersList = false;
							//			group._isMemberListLoadError = false;
							//			group._members = groupMembers;
							//			for (var i = 0; i < group._members.length; i++) {
							//				group._members[i].isInvited = true;
							//				newJobAdv.addGroupMember(group.groupId, group._members[i].id);
							//			}
							//		})
							//		.catch(function () {
							//			group._isMemberListLoadError = true;
							//		})
							//	;
							//} else {
							//	//group._isMembersListExpanded = false;
							//}
						}

						function toggleAdvGroupSelectAll(groupId) {
							var group = $scope.jobAdv.getGroupExtras(groupId);
							if (newJobAdv.getInvitationGroups()[groupId].sendToAll) {
								newJobAdv.removeSendToAllFlag(groupId);

								_.each(group.users, function (user) {
									newJobAdv.removeGroupMember(groupId, user.id);
								})
							} else {
								newJobAdv.addSendToAllFlag(groupId);
								_.each(group.users, function (user) {
									newJobAdv.addGroupMember(groupId, user.id);
								})
							}
						}

						function toggleGroupInvitee(userId) {

						}

						function _loadOrgInvitees(orgId) {
							var deferred = $q.defer()
								, orgExtras = $scope.jobAdv.getOrgExtras(orgId);
							if (orgExtras.isLoaded) {
								deferred.resolve(orgExtras.users);
							}
							else {
								var options = {
									inviteType: "OWNER"
								};
								newJobAdv.getAdvOrgMembers(orgId, options)
									.then(function (orgMembers) {
										DataProvider.resource.User.inject(orgMembers);
										orgExtras.users = DataProvider.resource.User.filter({
											where: {
												id: {
													in: _.pluck(orgMembers, "id")
												}
											}
										});
										orgExtras.isLoaded = true;
										/* Add all users to invitee list */
										_.each(orgMembers, function (user) {
											$scope.jobAdv.addOrgMember(orgId, user.id);
										});
										deferred.resolve(orgMembers);
									})
									.catch(function (err) {
										orgExtras.err = err;
									})
									.finally(function () {
										orgExtras.isLoading = false;
									})
							}
							return deferred.promise;
						}

						function _loadGroupInvitees(groupId) {
							$scope.jobAdv.setGroupExtras(groupId, {});
							var deferred = $q.defer()
								, groupExtras = $scope.jobAdv.getGroupExtras(groupId);
							if (groupExtras.isLoaded) {
								deferred.resolve(groupExtras.users);
							}
							else {
								var options = {
									inviteType: "OWNER"
								};
								newJobAdv.getAdvGroupMembers(groupId, options)
									.then(function (groupMembers) {
										DataProvider.resource.User.inject(groupMembers);
										groupExtras.users = DataProvider.resource.User.filter({
											where: {
												id: {
													in: _.pluck(groupMembers, "id")
												}
											}
										});
										groupExtras.isLoaded = true;
										deferred.resolve(groupMembers);
									})
									.catch(function (err) {
										groupExtras.err = err;
									})
									.finally(function () {
										groupsMeta[groupId].isLoading = false;
									})
							}

							return deferred.promise;
						}

						function sendAdvertisement() {
							if (!newJobAdv.isValid()) {
								return;
							}
							blockUI.start("Sending job advertisement.");
							return newJobAdv.sendAdvertisement(job.id, $scope.formModel.inviteMsg)
								.then(function (res) {
									blockUI.stop(res.respMsg, {
										status: 'isSuccess'
									});
									$mdDialog.hide(res);
									return res;
								})
								.catch(function (err) {
									blockUI.stop(err.respMsg, {
										status: 'isError'
									});
								})
								.finally(function () {
								})
						}
					}
				],
				controllerAs: 'jobAdvCtrl'
			})
		}

		/**
		 * Show a view for managing job contributors.
		 * User can invite new member to become contributors in the job.
		 * @param job
		 */
		function showJobContributorsManager(job) {

		}

		function getPendingJobAdvertisements($scope, job) {

			$scope.jobAdvertiseInviteOwnerList = [];
			$scope.showNoDataMsg = false;
			$scope.loadingImage = true;
			$scope.showMsgJobContainer = true;

			blockUI.start("Loading Invitation sent..", {
				status: 'isLoading'
			});

			var targetJobAdvertiseBundle = DataProvider.resource.Job.get(job.id);
			targetJobAdvertiseBundle.advertiseInviteOwnerpendingList({}, {bypassCache: true})
				.then(function (jobAdvertiseInviteOwnerList) {

					for (var i = 0; i < jobAdvertiseInviteOwnerList.resp.length; i++) {
						$scope.jobAdvertiseInviteOwnerList.push(jobAdvertiseInviteOwnerList.resp[i]);
					}

					if ($scope.jobAdvertiseInviteOwnerList.length == 0) {
						$scope.showNoDataMsg = true;
						$scope.loadingImage = false;
					} else {
						$scope.showMsgJobContainer = false;
						$scope.loadingImage = false;
					}
				})
				.catch(function (error) {
				})
				.finally(function () {
					blockUI.stop();
				});
		}

	}

})();