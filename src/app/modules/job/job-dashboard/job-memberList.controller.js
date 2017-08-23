;
(function () {
	"use strict";

	angular.module('app')
		.controller('JobMemeberViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog', '$timeout', 'Lang', 'Session', 'JobInterimAction', 'State', 'JobDelegatorInviteService', JobMemberViewController])


	function JobMemberViewController($scope, $stateParams, blockUI, DataProvider, Dialog, $timeout, Lang, Session, JobInterimAction, State, JobDelegatorInviteService) {

		var jobId = $stateParams.jobId
			, LANG = Lang.en.data
			, jobModel
			, jobMemberListLoaderFn
			;
		
		init();

		function init() {
			$scope.JobTabCtrl.tab_curr = 'TAB_MEMBER_LIST';
			$scope.JobTabCtrl.optionMenuItems.TAB_MEMBER_LIST = [];
			angular.extend($scope, {
				onJobContributorOptionClick: onJobContributorOptionClick,
				onJobOwnerOptionClick: onJobOwnerOptionClick,
				onJobMemberListItemClick: onJobMemberListItemClick,
				askAndRemoveJobOwner: askAndRemoveJobOwner,
				askAndRemoveJobMember: askAndRemoveJobMember
			});
			
			$scope.MU.renewImgHash();

			if (jobModel) {
				$scope.jobMemberListLoaderFn
					= jobMemberListLoaderFn
					= createJobMemberListLoader();
				updateMembersMenuList();
				jobMemberListLoaderFn();
			} else {
				$scope.fetchJobDetails()
					.then(function () {
						jobModel = $scope.JobTabCtrl.jobModel;
						updateMembersMenuList();
						$scope.jobMemberListLoaderFn
							= jobMemberListLoaderFn
							= createJobMemberListLoader();
						updateMembersMenuList();
						jobMemberListLoaderFn();
					})
			}
		}

		function createJobMemberListLoader() {
			return $scope.MU.ServiceRunner
				.buildServiceRunnerFn(function () {
					return $scope.JobTabCtrl.jobModel.findContributors()
						.then(function (data) {
							$scope.contributorList = data.resp.results;
							return data;
						})
				}, {showSuccess: false});
		}

		function onJobMemberListItemClick(userId) {
			return State.transitionTo('root.app.user', {
				id: userId
			});

		}

		function updateMembersMenuList() {

			$scope.JobTabCtrl.optionMenuItems.TAB_MEMBER_LIST = [];

			var membersMenuItems = [
				{
					name: LANG.JOB.BUTTON.ADVERTISE,
					action: startNewAdvertisementFlow,
					args: null,
					isAllowed: $scope.JobTabCtrl.jobModel.canExecuteActionByRole('JOB_ADVERTISE') && $scope.JobTabCtrl.jobModel.canExecuteActionByStatus('JOB_ADVERTISE') && !$scope.JobTabCtrl.jobModel.isOwned()
				},
				{
					name: LANG.JOB.BUTTON.INVITE_CONTRIBUTORS,
					action: inviteDelegator,
					args: null,
					isAllowed: $scope.JobTabCtrl.jobModel.canExecuteActionByRole('JOB_INVITE_CONTRIBUTOR') && $scope.JobTabCtrl.jobModel.canExecuteActionByStatus('JOB_INVITE_CONTRIBUTOR')
				},
				{
					name: "View Owner Invitees Status",
					action: jobInviteStatusClick,
					args: "OWNER",
					isAllowed: $scope.JobTabCtrl.jobModel.canExecuteActionByRole('JOB_ADVERTISE') && $scope.JobTabCtrl.jobModel.canExecuteActionByStatus('JOB_ADVERTISE')
				},
				{
					name: "View Contributor Invitees Status",
					action: jobInviteStatusClick,
					args: "DELEGATOR",
					isAllowed: $scope.JobTabCtrl.jobModel.canExecuteActionByRole('JOB_INVITE_CONTRIBUTOR') && $scope.JobTabCtrl.jobModel.canExecuteActionByStatus('JOB_INVITE_CONTRIBUTOR')
				}
			];

			angular.forEach(membersMenuItems, function (menuItem) {
				if (menuItem.isAllowed) {
					$scope.JobTabCtrl.optionMenuItems.TAB_MEMBER_LIST.push(menuItem);
				}
			});
			$timeout(angular.noop);
		}

		function startNewAdvertisementFlow($event) {
			JobInterimAction.createNewAdvertisement($scope.JobTabCtrl.jobModel, {
					$event: $event
				})
				.then(function (res) {
					console.log(res);
				})
				.finally(function () {
				})
		}

		function askAndRemoveJobMember(user) {
			Dialog.confirm({
					title: "Remove Member",
					content: "Do you wish to remove this member ?",
					ok: LANG.BUTTON.REMOVE,
					cancel: LANG.BUTTON.CANCEL
				})
				.then(function () {
					blockUI.start(LANG.JOB.JOB_LOADING_MSGS.REMOVING_MEMBER);
					$scope.JobTabCtrl.jobModel.removeMember(user.id)
						.then(function (res) {
							// onTabSelect($scope.tab_curr);
							blockUI.stop(res.respMsg);

							$scope.JobTabCtrl.jobModel.findContributors().then(function (data) {
								$scope.contributorList = data.resp.results;
							});


						})
						.catch(function (error) {
							blockUI.stop(error.respMsg, {
								status: 'isError',
								action: LANG.BUTTON.OK
							});
						});
				})
		}

		function askAndRemoveJobOwner(user) {
			Dialog.confirm({
					title: "Remove Member",
					content: "Do you wish to remove this Owner ?",
					ok: LANG.BUTTON.REMOVE,
					cancel: LANG.BUTTON.CANCEL
				})
				.then(function () {
					blockUI.start(LANG.JOB.JOB_LOADING_MSGS.REMOVING_MEMBER);
					var JobOwnerId = $scope.JobTabCtrl.jobModel.jobOwnerContributorId;
					$scope.JobTabCtrl.jobModel.removeMember(JobOwnerId)
						.then(function (res) {
							// onTabSelect($scope.tab_curr);
							blockUI.stop(res.respMsg);
							$scope.fetchJobDetails()
								.then(function () {
									updateMembersMenuList();
								})

						})
						.catch(function (error) {
							blockUI.stop(error.respMsg, {
								status: 'isError',
								action: LANG.BUTTON.OK
							});
						});
				})
		}

		function onJobMemberItemClick(user) {

			$scope.transitionTo('root.app.user', {
				id: user.userid
			}, {
				REPLACE_STATE: true
			});
		}

		function onJobMemberOptionClick(user, isAdmin) {
			var userActions = [{
				text: "View Profile",
				value: "profile"
			}];

			!isAdmin
			&& userActions.push({
				text: "Remove member",
				value: "removeMember"
			});

			Dialog.showListDialog(userActions)
				.then(function (selection) {
					switch (selection.value) {
						case 'profile':
							$scope.transitionTo('root.app.user', {id: $scope.JobTabCtrl.jobModel.originator.id});
							break;

						case 'removeMember':
							askAndRemoveJobMember(user);
							break;
					}
				})

		}

		function onJobOwnerOptionClick(user, isAdmin) {
			var userActions = [{
				text: "View Profile",
				value: "profile"
			}];


			if ($scope.JobTabCtrl.jobModel.originator.id == $scope.session.userId && ($scope.JobTabCtrl.jobModel.isCreated() || $scope.JobTabCtrl.jobModel.isClosed())) {

				userActions.push({
					text: "Remove member",
					value: "removeMember"
				});

			}

			Dialog.showListDialog(userActions)
				.then(function (selection) {
					switch (selection.value) {
						case 'profile':
							$scope.transitionTo('root.app.user', {id: $scope.JobTabCtrl.jobModel.originator.id});
							break;

						case 'removeMember':
							askAndRemoveJobOwner(user);
							break;
					}
				})

		}

		function onJobContributorOptionClick(user) {
			var userActions = [{
				text: "View Profile",
				value: "profile"
			}];


			if ($scope.JobTabCtrl.jobModel.amITheOwner()) {

				userActions.push({
					text: "Remove member",
					value: "removeMember"
				});

			}

			Dialog.showListDialog(userActions)
				.then(function (selection) {
					switch (selection.value) {
						case 'profile':
							$scope.transitionTo('root.app.user', {id: user.id});
							break;

						case 'removeMember':
							askAndRemoveJobMember(user);
							break;
					}
				});

		}

		function inviteDelegator() {
			/*
			 * $scope.transitionTo('root.app.job-contributors', { jobId: jobId
			 * });
			 */

			JobDelegatorInviteService.createNewDelegatorInvite($scope.JobTabCtrl.jobModel)
				.then(function (res) {
					console.log(res);
				})
				.finally(function () {
				})
		}

		function viewDelegator() {
			$scope.transitionTo('root.app.job-contributors', {
				jobId: jobId
			});
		}
		
		function jobInviteStatusClick(type) {
			var role;
			if (type == "OWNER") {
				role = "Owner";
			} else {
				role = "Contributor";
			}
			
           	blockUI.start("Loading ...", {
        		status: 'isLoading'
        	});
           	
        	var _params = {
        			userSessionId : Session.id,
        			id : jobId,
        			inviteType : type,
        			pageSize: 25,
        			pageNumber: 1
        	}
           	
           	JobDelegatorInviteService.onJobInviteStatusList(_params)
			.then(function (resp) {
				if (resp.results.length > 0) {
					blockUI.stop();
					JobDelegatorInviteService.onJobInviteStatusDialog(resp,_params,role)
					.then(function (result) {
					}).catch(function (err) {
					})
				} else {
					blockUI.stop("No invitations are sent", {
						status: 'isSuccess',
						action: LANG.BUTTON.OK
					})
				}
			}).catch(function (err) {
				Dialog.alert({
					content: err.message,
					ok: "Ok"
				});
			}).finally(function () {
				blockUI.stop();
			});
			
		}


	}


})();