/**
 * Created by sudhir on 25/6/15.
 */

;
(function () {
  "use strict";

  angular.module('app')
    .controller('GroupEditViewController', [
      '$scope', '$q', '$controller', '$timeout', '$stateParams', 'State',
      'Connect', 'URL', 'DataProvider',
      'mDialog', 'ImagePicker',
      GroupEditViewController
    ])
  ;

  function GroupEditViewController($scope, $q, $controller, $timeout, $stateParams, State,
                                   Connect, URL, DataProvider,
                                   Dialog, ImagePicker) {
    var self = this;

    angular.extend(self, $controller('ViewDataBaseController', {$scope: $scope}));
    self.group = self.initializeViewDataBaseController('groupDetails',
      fetchGroupDetails, findGroupDetails);

    angular.extend(self, $controller('FormBaseController', {$scope: $scope}));
    angular.extend(self, self.initializeEditorToolbar('groupEditToolbar', 'group_edit'));
    angular.extend(self, self.initializeForm('group_edit', {
      submitFn: sendGroupUpdateRequest,
      messages: {
        inProgress: "Updating room.",
        success: "Group details updated."
      }
    }));

    State.waitForTransitionComplete().then(function() {
      refresh({bypassCache: true}).then(function() {
        initGroupEditFormModel();
      })
    });

    $scope.data = {
      org: {},
      group: {}
    };
    $scope.refresh = refresh;
    $scope.submit = submit;
    $scope.initGroupEditFormModel = initGroupEditFormModel;
    $scope.editGroupImage = editGroupImage;

    function refresh(options) {
      options = options || {};
      options.params = {
        orgId: $stateParams.orgId,
        grpId: $stateParams.groupId
      };
      return $scope.groupDetails.refresh(options).then(function(res) {
        $scope.data.group = self.group.groupDetails.data;
      })
    }

    function initGroupEditFormModel() {
      $scope.formModel.group_edit = angular.copy(self.group.groupDetails.data);
      $scope.form.group_edit.$setPristine();
    }

    function submit() {
      self.group_edit.submit().then(function(res) {
        console.log(res);
      })
    }

    function sendGroupUpdateRequest() {
      var deferred = $q.defer();

      updateGroupDetails().then(function(res) {
        deferred.resolve(res);
      }).catch(function(error) {
        deferred.reject(error);
      });

      return deferred.promise;
    }

    function updateGroupDetails() {
      var deferred = $q.defer();

      DataProvider.resource.Group.update(
        self.group.groupDetails.data.id,
        $scope.formModel.group_edit)
        .then(function(res) {
          $scope.form.group_edit.$setPristine();
          deferred.resolve();
        })
        .catch(function(error) {
          deferred.reject(error);
        });

      return deferred.promise;
    }

    function updateGroupImage() {}

    function editGroupImage() {
      ImagePicker.grabNewImage({
        targetWidth: ImagePicker.IMAGE_PRESET.PROFILE.WIDTH,
        targetHeight: ImagePicker.IMAGE_PRESET.PROFILE.HEIGHT
      }).then(function (imageUri) {
        if(imageUri) {
          $scope.formModel.group_edit._img_icon = imageUri;
          $scope.form.group_edit.$setDirty();
        } else {
          console.error("Image URI not found");
        }
      })
    }

    function fetchGroupDetails(options) {
      return DataProvider.resource.Group.find($stateParams.groupId, options)
    }

    function findGroupDetails(options) {
      return DataProvider.resource.Group.get($stateParams.groupId)
    }
  }

})();