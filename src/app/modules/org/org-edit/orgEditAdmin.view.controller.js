/**
 * Created by sudhir on 28/5/15.
 */


;
(function () {
  "use strict";

  angular.module('app')
    .controller('OrganisationAdminViewController', OrganisationAdminViewController)
  ;

  function OrganisationAdminViewController($scope, $controller, $q, State, $stateParams,
                                           DataProvider, ImagePicker, Connect,
                                           URL, Lang,blockUI) {
    var self = this;
    $scope.editOrganisationCoverImage = editOrganisationCoverImage;
    $scope.editOrganisationProfileImage = editOrganisationProfileImage;
    $scope.resetOrgFormModel = resetOrgFormModel;
    $scope.refresh = refresh;
    $scope.submit = submit;

    angular.extend(self, $controller('ViewDataBaseController', {$scope: $scope}));
    self.orgDataModel = self.initializeViewDataBaseController('org',
      fetchOrgDetails, findOrgDetails);

    angular.extend(self, $controller('FormBaseController', {$scope: $scope}));
    angular.extend(self, self.initializeEditorToolbar('orgEditToolbar', 'org_edit'));
    angular.extend(self, self.initializeForm('org_edit', {
      submitFn: sendOrgUpdateRequest,
      messages: {
        inProgress: "Updating WorkSpace",
        success: "WorkSpace updated.",
        error: ""
      }
    }));

    State.waitForTransitionComplete().then(function () {
        blockUI.start("Loading WorkSpace Details..", {
            status: 'isLoading'
          });
      $scope.org.refresh().then(function () {
        console.log(self.orgDataModel.org.data);
        resetOrgFormModel();
        blockUI.stop();
      });
      
    });
    function submit() {
      self.org_edit.submit().then(function (result) {
        console.log(result);
      });
    }

    function refresh(options) {
      return $scope.org.refresh(options);
    }

    function sendOrgUpdateRequest() {
      var deferred = $q.defer();
      updateOrgDetails()
        .then(uploadCoverImage)
        .then(uploadIconImage)
        .then(function (result) {
          deferred.resolve(result);
          console.log(result);
          refresh({bypassCache: true});
          $scope.form.org_edit.$setPristine();
        }).catch(function (error) {
          deferred.reject(error);
          console.error(error);
        });
      return deferred.promise;
    }

    function uploadCoverImage() {
      var deferred = $q.defer();

      //if ($scope.formModel.org_edit._img_full != self.orgDataModel.org.data._img_full) {
      if ($scope.formModel.org_edit._img_full_dirty) {
        var uploadParams = {
          entityId: $stateParams.orgId,
          imgEntityType: "ORG",
          imgType: "FULL"
        };

        Connect.upload(
          URL.UPLOAD_FILE,
          $scope.formModel.org_edit_img_full,
          {
            params: uploadParams
          })
          .then(function onUploadSuccess(success) {
            deferred.resolve(success);
          }, function onUploadError(error) {
            deferred.reject(error);
          });
      } else {
        deferred.resolve();
      }

      return deferred.promise;
    }

    function uploadIconImage() {
      var deferred = $q.defer();

      //if ($scope.formModel.org_edit._img_icon != self.orgDataModel.org.data._img_icon) {
      if ($scope.formModel.org_edit._img_icon_dirty) {
        var uploadParams = {
          entityId: $stateParams.orgId,
          imgEntityType: "ORG",
          imgType: "ICON"
        };

        Connect.upload(
          URL.UPLOAD_FILE,
          $scope.formModel.org_edit_img_icon,
          {
            params: uploadParams
          })
          .then(function onUploadSuccess(success) {
            deferred.resolve(success);
          }, function onUploadError(error) {
            deferred.reject(error);
          });
      } else {
        deferred.resolve();
      }

      return deferred.promise;
    }

    function updateOrgDetails() {
      var deferred = $q.defer();
      if ($scope.form.org_edit.$valid) {
        if ($scope.form.org_edit.$dirty) {
          console.log($scope.formModel.org_edit);
          DataProvider.resource.Organisation.update(
            self.orgDataModel.org.data.id,
            angular.copy($scope.formModel.org_edit))
            .then(function (result) {
              refresh({bypassCache: true});
              deferred.resolve(result);
            }).catch(function (error) {
              deferred.reject(error);
            })
        }
      } else {
        deferred.reject();
      }

      return deferred.promise;
    }

    function resetOrgFormModel() {
      $scope.formModel.org_edit = angular.copy(self.orgDataModel.org.data);
      $scope.form.org_edit.$setPristine();
      $scope.formModel.org_edit._img_icon_dirty = false;
      $scope.formModel.org_edit._img_full_dirty = false;
    }

    function editOrganisationCoverImage() {
      "use strict";
      ImagePicker.grabNewImage({
        targetWidth: ImagePicker.IMAGE_PRESET.COVER.WIDTH,
        targetHeight: ImagePicker.IMAGE_PRESET.COVER.HEIGHT
      }).then(function (imageUri) {
        console.log(imageUri);
        if(imageUri) {
          $scope.formModel.org_edit_img_full = imageUri;
          $scope.formModel.org_edit._img_full = imageUri;
          $scope.formModel.org_edit._img_full_dirty = true;
        } else {
        }
        $scope.form.org_edit.$setDirty();
      });
    }

    function editOrganisationProfileImage() {
      "use strict";
      ImagePicker.grabNewImage({
        targetWidth: ImagePicker.IMAGE_PRESET.PROFILE.WIDTH,
        targetHeight: ImagePicker.IMAGE_PRESET.PROFILE.HEIGHT
      }).then(function (imageUri) {
        console.log(imageUri);
        if(imageUri) {
          $scope.formModel.org_edit_img_icon = imageUri;
          $scope.formModel.org_edit._img_icon = imageUri;
          $scope.formModel.org_edit._img_icon_dirty = true;
        } else {
        }
        $scope.form.org_edit.$setDirty();
      });
    }

    function fetchOrgDetails() {
      var org = DataProvider.resource.Organisation.get($stateParams.orgId);
      if(org) org.refreshImageHash();
      return DataProvider.resource.Organisation.find($stateParams.orgId, {
        bypassCache: true
      });
    }

    function findOrgDetails() {
      return DataProvider.resource.Organisation.get($stateParams.orgId);
    }

  }

  OrganisationAdminViewController.$inject = ['$scope', '$controller', '$q', 'State', '$stateParams',
    'DataProvider', 'ImagePicker', 'Connect',
    'URL', 'Lang','blockUI'];

})();