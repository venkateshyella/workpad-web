/**
 * Created by sudhir on 27/5/15.
 */

;
(function () {
  "use strict";

  angular.module('app')
    .service('OrgAdminService_Old', OrgAdminService)
    .controller('OrgCreateDialogController', OrgCreateDialogController)
  ;

  function OrgAdminService(Dialog) {
    return {
      CreateNewOrganisation: CreateNewOrganisation
    };

    function CreateNewOrganisation(options) {
      options = options || {};
      return Dialog.show({
        controller: 'OrgCreateDialogController',
        templateUrl: 'app/modules/org/templates/org-create.dialog.tpl.html',
        targetEvent: options.$event,
      })
    }
  }

  OrgAdminService.$inject = [
    'mDialog'
  ];


  function OrgCreateDialogController($scope, $controller, $mdDialog, blockUI, OrgService) {
    var self = this;
    angular.extend(self, $controller('FormBaseController', {$scope: $scope}));

    self.createOrgFormCtrl = self.initializeForm('create_org', {
      submitFn: sendSubmitReq
    });

    $scope.cancel = $mdDialog.cancel;

    $scope.submit = function submit() {
      self.createOrgFormCtrl.create_org.submit().then(function (result) {
        $mdDialog.hide(result);
      }).catch(function(error) {
        // Do nothing
      });
    };

    function sendSubmitReq(orgFormModel) {
      return OrgService.submitCreateOrgReq({
        orgName: orgFormModel.name,
        orgDesc: orgFormModel.desc
      });
    }
  }

  OrgCreateDialogController.$inject = ['$scope', '$controller', '$mdDialog', 'blockUI', 'OrgService'];

})();