/**
 * Created by sudhir on 27/5/15.
 */

;
(function() {
    "use strict";

    angular.module('app')
        .service('GroupAdminService', GroupAdminService);

    function GroupAdminService(Dialog,$q) {
        return {
            CreateNewGroup: CreateNewGroup,
            UpdateGroup: UpdateGroup,
        };

        function CreateNewGroup(orgModel, groupModel) {

            var deferred = $q.defer();
             Dialog.show({
                controller: ['$scope', '$controller', '$mdDialog', 'blockUI', 'mDialog', 'GroupService','Lang','State',
                    function GroupCreateDialogController($scope, $controller, $mdDialog, blockUI, mDialog, GroupService,Lang, State) {
                        var self = this;
                        $scope.LANG = Lang.en.data;

                        $scope.form = {};
                        $scope.form.create_group = {};
                        $scope.formModel = {};
                        $scope.formModel.create_group = {};
                        $scope.cancel = $mdDialog.cancel;

                        $scope.submit = function submit(groupFormModel) {

                            blockUI.start("Creating Room", {
                                status: 'isLoading'
                            });

                            GroupService.submitCreateGroupReq({
                                    groupModel: groupFormModel
                                }, {
                                    orgModel: orgModel
                                }, { 
                                    parentGroup: groupModel 
                                })
                                .then(function(result) {
                                    blockUI.stop();
                                    $mdDialog.hide();
                                    deferred.resolve(result);

                                }).catch(function(error) {
                                    blockUI.stop();
                                    $mdDialog.hide();
                                    
                                    if (orgModel.memberType == 1 && error.responseCode == 7) {
                                    	 Dialog.confirm({
                                             content: error.respMsg,
                                             ok: 'Subscribe',
                                             cancel: "Cancel"
                                         }).then(function(res) {
                                        	 State.transitionTo('root.app.subscription', {
                           					  orgId:orgModel.id
                           		            }, {
                           		            	FLAGS: {
                        							CLEAR_STACK: true
                        						}
                           		            });
                                         }).catch(function() {

                                         });
									} else {
										Dialog.alert(error.respMsg);
									}
                                    
                                    
                                    deferred.resolve(error);
                                });

                        };

                    }
                ],
                templateUrl: 'app/modules/group/templates/group-create.dialog.tpl.html',
                clickOutsideToClose:false
            });
         return deferred.promise;

        }

        function UpdateGroup(group) {

            var groupModel = angular.copy(group);
             var deferred = $q.defer();
             Dialog.show({
                controller: ['$scope', '$controller', '$mdDialog', 'blockUI', 'mDialog', 'GroupService','Lang',
                    function GroupUpdateDialogController($scope, $controller, $mdDialog, blockUI, mDialog, GroupService,Lang) {
                        var self = this;

                         $scope.LANG = Lang.en.data;

                        $scope.form = {};
                        $scope.formModel = {};
                        $scope.formModel.Update_group = groupModel;
                        $scope.cancel = $mdDialog.cancel;


                        $scope.submit = function submit(updatedData) {

                            blockUI.start("Updating Room", {
                                status: 'isLoading'
                            });

                            GroupService.submitUpdateGroupReq(groupModel.id, $scope.formModel.Update_group)
                                .then(function(result) {
                                    blockUI.stop();
                                    $mdDialog.hide();
                                    deferred.resolve(result);

                                }).catch(function(error) {
                                    blockUI.stop();
                                    $mdDialog.hide();
                                    deferred.resolve(error);
                                });
                        };

                    }
                ],
                templateUrl: 'app/modules/group/templates/group-update.dialog.tpl.html',
                clickOutsideToClose:false
            });
            return deferred.promise;
        }

    }

    GroupAdminService.$inject = [
        'mDialog','$q'
    ];
})();
