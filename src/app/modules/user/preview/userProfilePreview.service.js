/**
 * Created by sudhir on 19/6/15.
 */

;
(function () {
  "use strict";

  angular.module('app')
    .service('UserProfilePreviewService', [
      '$q', 'mDialog',
      UserProfilePreviewService])
  ;

  function UserProfilePreviewService($q, Dialog) {

    return {
      showPreview: showPreview
    };

    /**
     * @desc Show a preview of the user profile
     * @param user
     */
    function showPreview(user, options) {
      var options = options || {};
      console.log(user);

      return Dialog.show({
        controller: ['$scope', '$controller', '$mdDialog',
          function UserProfilePreviewController($scope, $controller, $mdDialog) {
            var self = this;

            $scope.data = {};
            $scope.data.user = user;

            $scope.dialogCancel = $mdDialog.cancel;

          }],
        templateUrl: 'app/modules/user/preview/userProfilePreview.dialog.tpl.html',
        //templateUrl: 'app/modules/user-invite/templates/user-invitation.dialog.tpl.html',
        targetEvent: options.$event
      });

    }

  }

})();
