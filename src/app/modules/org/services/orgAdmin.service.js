/**
 * Created by sudhir on 27/5/15.
 */

;
(function() {
    "use strict";

    angular.module('app')
        .service('OrgAdminService', OrgAdminService);

    function OrgAdminService(Dialog,$q) {
        return {
            CreateNewOrganisation: CreateNewOrganisation,
            UpdateOrg: UpdateOrg,
        };

        function CreateNewOrganisation() {

            var deferred = $q.defer();
             Dialog.show({
                controller: ['$scope', '$controller', '$mdDialog', 'blockUI', 'mDialog', 'OrganisationService',
                    function OrgCreateDialogController($scope, $controller, $mdDialog, blockUI, mDialog, OrganisationService) {
                        var self = this;

                        $scope.form = {};
                        $scope.formModel = {};
                        $scope.formModel.create_org = {};
                        $scope.cancel = $mdDialog.cancel;

                        $scope.submit = function submit(orgFormModel) {

                            blockUI.start("Creating WorkSpace", {
                                status: 'isLoading'
                            });

                            OrganisationService.submitCreateOrgReq({
                                    orgName: orgFormModel.name,
                                    orgDesc: orgFormModel.desc
                                })
                                .then(function(result) {
                                    blockUI.stop();
                                    $mdDialog.hide();
                                    deferred.resolve(result);

                                }).catch(function(error) {
                                    blockUI.stop();
                                   $mdDialog.hide();
                                   deferred.reject(error);
                                });

                        };

                    }
                ],
                templateUrl: 'app/modules/org/templates/org-create.dialog.tpl.html',
                clickOutsideToClose:false
                
            });

          return deferred.promise;

        }

        function UpdateOrg(org) {

            var orgModel = angular.copy(org);
            var deferred = $q.defer();
             Dialog.show({
                controller: ['$scope', '$controller', '$mdDialog', 'blockUI', 'mDialog', 'OrganisationService', 'ImagePicker',
                    function OrgUpdateDialogController($scope, $controller, $mdDialog, blockUI, mDialog, OrganisationService, ImagePicker) {
                        var self = this;

                        $scope.form = {};
                        $scope.formModel = {};
                        $scope.formModel.CreateAndUpdate_org = orgModel;
                        $scope.cancel = $mdDialog.cancel;
                        /*$scope.editOrganisationProfileImage = editOrganisationProfileImage;

                        function editOrganisationProfileImage() {
                            "use strict";
                            ImagePicker.grabNewImage({
                                targetWidth: ImagePicker.IMAGE_PRESET.PROFILE.WIDTH,
                                targetHeight: ImagePicker.IMAGE_PRESET.PROFILE.HEIGHT
                            }).then(function(imageUri) {
                                console.log(imageUri);
                                if (imageUri) {
                                    $scope.formModel.CreateAndUpdate_org._img_icon = imageUri;
                                    $scope.formModel.CreateAndUpdate_org._img_icon_dirty = true;
                                } else {}
                            });
                        }*/

                        $scope.submit = function submit(updatedData) {

                            blockUI.start("Updating WorkSpace", {
                                status: 'isLoading'
                            });

                            OrganisationService.submitUpdateOrgReq(orgModel.id, $scope.formModel.CreateAndUpdate_org)
                                .then(function(result) {
                                    blockUI.stop();
                                    $mdDialog.hide();
                                    deferred.resolve(result);

                                }).catch(function(error) {
                                    blockUI.stop();
                                    $mdDialog.hide();
                                    deferred.reject(error);
                                });

                        };

                    }
                ],
                templateUrl: 'app/modules/org/templates/org-CreateAndUpdate.dialog.tpl.html',
                clickOutsideToClose:false
            });
        return deferred.promise;
        }

    }

    OrgAdminService.$inject = [
        'mDialog','$q'
    ];
})();
