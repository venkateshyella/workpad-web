/**
 * Created by sudhir on 4/1/16.
 */

angular.module('app')
    .controller('UserSkillsEditorViewController', [
        '$scope', '$q', '$timeout', '$stateParams', '$controller',
        'Session', '$http', 'blockUI',
        'Connect',
        'DataProvider', 'State', 'mDialog',
        'URL', 'Lang',
        function($scope, $q, $timeout, $stateParams, $controller,
            Session, $http, blockUI,
            Connect, DataProvider,
            State, Dialog) {
            "use strict";
            var userId = $stateParams.id,
                user = null;
            $scope.viewScope.editorViewTitle = "Edit Skills";

            $scope.searchText = "";
            $scope.createAddSkill = createAddSkill;
            $scope.searchTextChange = searchTextChange;
            $scope.selectedItemChange = selectedItemChange;
            $scope.querySearch = querySearch;
            $scope.addSkill = addSkill;

            function querySearch(searchText) {
                var deferred;
                var query = searchText || "";
                if (query) {
                    deferred = $q.defer();
                    Connect.get(URL.ADDSKILL, {
                            name: query
                        })
                        .then(function(resp) {
                            if (resp.responseCode != 0) {
                                // Connection Error
                                $scope.addSkills = [];
                                $scope.searchStatusText = resp.respMsg;
                            } else {
                                var skills = resp.resp;
                                $scope.addSkills = skills;
                                $scope.searchStatusText = "No matches found for " + query + ".";
                            }
                            if ($scope.searchStatusText.indexOf("No matches found") >= 0) {
                                $scope.isDisabled = false;
                            }
                            //$scope.$emit('newSkillAdd', {skill :query});
                            deferred.resolve($scope.addSkills);
                        })
                        .catch(function(error) {
                            $scope.searchStatusText = LANG.ERROR.NETWORK_FAILURE;
                            deferred.reject(error);
                        });
                    return deferred.promise;
                }
            }

            function searchTextChange($model, text) {
                //console.info('Text changed to ' + text);
                if (text.length < 1) {
                    $scope.isDisabled = true;
                }
            }

            function selectedItemChange(item) {
                self.selectedItem = item;
                $scope.form.create_newskill = item;
                //console.info('Item changed to ' + JSON.stringify(item));
                // $scope.$emit('newSkillAdd', {skill :item.name});
            }

            function createAddSkill(skillName) {
                var deferred = $q.defer();
                var options = options || {};

                Dialog.show({
                        templateUrl: 'app/modules/user/profile/templates/newskill-create.dialog.tpl.html',
                        controller: ['$scope', '$mdDialog', '$controller', 'Lang', function($scope, $mdDialog, $controller) {
                            var self = this;
                            $scope.cancel = $mdDialog.cancel;
                            angular.extend(self, $controller('FormBaseController', {
                                $scope: $scope
                            }));

                            $scope.formModel.create_newskill = {
                                newSkillName: skillName
                            };

                            $scope.submit = function submit() {
                                var skillData = $scope.formModel.create_newskill;
                                $mdDialog.hide(skillData);
                            };
                            $timeout(function() {
                                $mdDialog.hide();
                            }, 1740000);
                        }],
                        $event: options.$event,
                        clickOutsideToClose:false
                    })
                    .then(function(skillData) {
                        if (skillData.newSkillName) {
                            $scope.addSkill(skillData.newSkillName, skillData.newSkillDesc, skillData.newSkillRating);
                        }
                        deferred.resolve();
                    });
                return deferred.promise;
            }

            function addSkill(skillName, skillDesc, skillRating) {
                var userId = $stateParams.id;
                if (skillName && skillName.length > 0 && $scope.form.userForm.$valid) {
                    $scope.user.skills.unshift({
                        expertise: skillName,
                        description: skillDesc,
                        rating: skillRating
                    });
                    $scope.form.skillListEditStatus = 'allowEdit';
                    $scope.form.userForm.$setDirty();

                    $scope.viewScope.toggleEditToolbar = true;

                }
            };

            function confirmAndDeleteSkill(index) {
                var confirmPromise = Dialog.showConfirm({
                    title: LANG.DIALOG.DELETE_SKILL.TITLE,
                    content: LANG.DIALOG.DELETE_SKILL.CONTENT,
                    ok: LANG.BUTTON.OK,
                    cancel: LANG.BUTTON.CANCEL,
                    clickOutsideToClose: true
                });

                function onConfirmOk(res) {
                    var userId = $stateParams.id;
                    if (index >= 0 && index < $scope.user.skills.length) {
                        $scope.user.skills.splice(index, 1);
                        $scope.form.userForm.$setDirty();
                        $scope.viewScope.toggleEditToolbar = true;
                    }
                }

                confirmPromise.then(onConfirmOk, angular.noop);

            };



        }
    ]);
