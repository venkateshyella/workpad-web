/**
 * Created by sudhir on 2/6/15.
 */


;
(function () {

	angular.module('app')
		.service('UserSkillEditService', ['$q',
			'DataProvider', 'mDialog',
			'Connect', 'URL', 'AppCoreUtilityServices',
			'Lang', 'APP_POST', '$timeout', 'blockUI',
			UserSkillEditService
		]);

	function UserSkillEditService($q, DataProvider, Dialog, Connect, URL, AppCoreUtilityServices, Lang, APP_POST, $timeout, blockUI) {

		var self = this,
			LANG = Lang.en.data;

		return {
			showAddSkillDialog: showAddSkillDialog,
			showRemoveSkillDialog: showRemoveSkillDialog
		};


		function showRemoveSkillDialog(userId, options) {

			var user = DataProvider.resource.User.get(userId);
			options = options || {};
			Dialog.show({
				controller: ['$scope', '$mdDialog',
					function userAddSkillDialogController($scope, $mdDialog) {
						$scope.LANG = LANG;
						$scope.user = user;
						$scope.toggleSelectAll = toggleSelectAll;

						$scope.skills = angular.copy($scope.user.skills);
						$scope.selectSkillForDeletion = selectSkillForDeletion;
						$scope.selectedSkills = [];

						function updateSelection() {
							var selectedSkills = _.where($scope.skills, {
								isSelected: true
							});
							$scope.isAllSelected = selectedSkills.length == $scope.skills.length;
							if (selectedSkills.length > 1) {
							}

							$scope.selectedSkills = selectedSkills;
						}


						function toggleSelectAll(status) {
							var targetSelectStatus = false;
							if (!angular.isDefined(status)) {
								targetSelectStatus = !$scope.isAllSelected;
							} else {
								targetSelectStatus = !!status;
							}
							_.each($scope.skills, function (skill) {
								skill.isSelected = targetSelectStatus;
							});
							updateSelection();
						}


						function selectSkillForDeletion(skillObj) {
							skillObj.isSelected = !skillObj.isSelected;
							updateSelection();
						}


						$scope.updateUserSkills = function () {
							blockUI.start(LANG.USER_EDIT.LOADING_MSGS.UPDATING_PROFILE);

							var newSkillsList = angular.copy(_.filter($scope.skills, function (skill) {
								return !skill.isSelected
							}));

							// remove
							_.each(newSkillsList, function (skill) {
								delete(skill.isSelected);
							});

							$scope.user.skills = newSkillsList;

							"use strict";
							DataProvider.resource.User.update($scope.user.id,
								$scope.user).then(function (updatedUserModel) {
								console.log("user skills Updated");
								blockUI.stop(LANG.USER_EDIT.LOADING_MSGS.UPDATING_PROFILE_SUCCESS, {
									status: 'isSuccess'
								});
								$mdDialog.hide(updatedUserModel);

								deferred.resolve(result);
							}, function onUpdateFail(error) {
								blockUI.stop(err.respMsg, {
									status: 'isError'
								});
								deferred.reject(error);
							});
						};
						$scope.cancel = $mdDialog.cancel;
						targetEvent: options.$event
					}
				],
				templateUrl: 'app/modules/user/profile/templates/removeSkill.dialog.tpl.html',
				 clickOutsideToClose:false,
				targetEvent: options.$event
			});


		} //end of showDeleteSkillDialog

		function showAddSkillDialog(userId, options) {

			var user = DataProvider.resource.User.get(userId);
			options = options || {};
			Dialog.show({
				controller: ['$scope', '$mdDialog',
					function userAddSkillDialogController($scope, $mdDialog) {

						$scope.newSkillName = "";
						$scope.isDisabled = true;

						$scope.searchText = "";
						$scope.searchTextChange = searchTextChange;
						$scope.addSkill = addSkill;
						$scope.selectedItemChange = selectedItemChange;
						$scope.querySearch = querySearch;
						$scope.searchStatusText = "";
						$scope.user = user;
						$scope.isAddSkillDisabled = true;
						$scope.createAddSkill = createAddSkill;
						var userskillObj ="";
						$scope.iscreateAndAddNewSkill = false;
						$scope.createSkillData = {
							newSkillName: "",
							newSkillDesc: ""
						};
						$scope.createAndAddSkillsubmit = createAndAddSkillsubmit;
						$scope.form = {};


						function searchTextChange($model, text) {
							//console.info('Text changed to ' + text);
							if (text.length < 1) {
								$scope.isDisabled = true;
							}
						}

						function addSkill(skillName, skillDesc, skillRating) {
							var userId = user.id;
							if (skillName && skillName.length > 0) {
								userskillObj = {
									expertise: skillName,
									description: skillDesc,
									rating: skillRating
								};
								
							}

							// $scope.submit();
						};

						function selectedItemChange(item) {
							if (item) {
								console.log("selected Item");
								$scope.isAddSkillDisabled = false;
							}
						}

						function querySearch(searchText) {
							var deferred;
							var query = searchText || "";
							if (query) {
								deferred = $q.defer();
								Connect.get(URL.ADDSKILL, {
										name: query
									})
									.then(function (resp) {
										if (resp.responseCode != 0) {
											// Connection Error
											$scope.addSkills = [];
											$scope.searchStatusText = resp.respMsg;
										} else {
											var skills = resp.resp;
											$scope.addSkills = skills;
											$scope.searchStatusText = query;
										}

										if (resp.resp.length == 0) {
											$scope.isDisabled = false;
											$scope.isAddSkillDisabled = true;
										}

										/*if ($scope.searchStatusText.indexOf("No matches found") >= 0) {
										 $scope.isDisabled = false;
										 }*/
										//$scope.$emit('newSkillAdd', {skill :query});
										deferred.resolve($scope.addSkills);
									})
									.catch(function (error) {
										$scope.searchStatusText = LANG.ERROR.NETWORK_FAILURE;
										deferred.reject(error);
									});
								return deferred.promise;
							}
						}

						function createAddSkill(skillName) {
							$scope.iscreateAndAddNewSkill = true;
							$scope.createSkillData.newSkillName = skillName;
						}

						function createAndAddSkillsubmit() {
							console.log("send data");
							var skillData = $scope.createSkillData;
							$scope.addSkill(skillData.newSkillName, skillData.newSkillDesc, skillData.newSkillRating);
							$scope.submit();
						}

						$scope.submit = function () {
							/*if($scope.createSkillData.newSkillName){
							 var skillData = $scope.createSkillData;
							 $scope.addSkill(skillData.newSkillName, skillData.newSkillDesc, skillData.newSkillRating);
							 }*/
							
							blockUI.start(LANG.USER_EDIT.LOADING_MSGS.UPDATING_PROFILE);
							$scope.user.skills.unshift(userskillObj);

							"use strict";
							DataProvider.resource.User.update($scope.user.id,
								$scope.user).then(function (updatedUserModel) {
								console.log("user skills Updated");
								blockUI.stop(LANG.USER_EDIT.LOADING_MSGS.UPDATING_PROFILE_SUCCESS, {
									status: 'isSuccess'
								});
								$mdDialog.hide(updatedUserModel);

								deferred.resolve(result);
							}, function onUpdateFail(error) {
								blockUI.stop(err.respMsg, {
									status: 'isError'
								});

								deferred.reject(error);
							});

						};
						$scope.cancel = $mdDialog.cancel;
						targetEvent: options.$event
					}
				],
				templateUrl: 'app/modules/user/profile/templates/addSkill.dialog.tpl.html',
				 clickOutsideToClose:false,
				targetEvent: options.$event
			});
		}

	}


})();
