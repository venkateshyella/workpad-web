/**
 * Created by Raj on 30/09/15.
 */


;
(function () {

  angular.module('app')
    .service('JobInvitationService', JobInvitationService)
  ;

  function JobInvitationService($q, DataProvider, Dialog, Connect, URL, Lang, Session, APP_POST,AppCoreUtilityServices) {

    var self = this,
      LANG = Lang.en.data
      ;

    return {
      showPrepareInvitationDialog: showPrepareInvitationDialog,
      sendInvite: sendInvite

    };

    /**
     * @doc service api
     *
     * @description
     * Show the invitation dialog where user can prepare.
     *
     * @param userEntity
     * @param options
     */
    function showPrepareInvitationDialog(user, targetBundleJob, options) {
      options = options || {};
      var userSessionId = Session.id;
      var invitee = user;
      var org = targetBundleJob.organization;
      var job = targetBundleJob;
      var image;
      if(invitee){
    	  image = AppCoreUtilityServices.getUserIconImageUrl(invitee.id,userSessionId);
      }
      
      return Dialog.show({
        controller: ['$scope', '$mdDialog', 'Lang',
          function jobInvitationDialogController($scope, $mdDialog, Lang) {
						var LANG = Lang.en.data;
            $scope.inviteBundle = {
              invitee: invitee,
              userImg : image,
              org: org,
              job: job
            };
						$scope.LANG = LANG;
            $scope.isActionsEnabled = true;
	          $scope.form = {};
	          $scope.formModel = {
		          inviteMsg: ""
	          };

            $scope.submit = function () {
              $scope.isActionsEnabled = false;


              sendInvite(invitee, job.id, $scope.formModel.inviteMsg)
                .then(function (resp) {
                  Dialog.showAlert({
                    content: resp.respMsg,
                    ok: LANG.BUTTON.OK
                  }).then(function () {
                    $mdDialog.hide(resp);
                  }).finally(function () {
                    $scope.isActionsEnabled = true;
                  });
                })
                .catch(function (error) {
                  Dialog.showAlert({
                    content: error.respMsg,
                    ok: LANG.BUTTON.OK
                  }).then(function () {
                    //$mdDialog.hide(resp);
                  });
                })
                .finally(function () {
                  $scope.isActionsEnabled = true;
                });
            };

            $scope.cancel = $mdDialog.cancel;

          }],

        templateUrl: 'app/modules/user-invite/templates/job-invite.dialog.tpl.html',
        targetEvent: options.$event
      });
    }

    function sendInvite(user, jobId, invitationMessage) {
      var invitations = [{"users":[user.id]}];
      var job =  DataProvider.resource.Job.get(jobId);
      var request = job.sendInviteToContributor(user, invitationMessage || "",invitations);
      return request;
    }
   
  }

  JobInvitationService.$inject = ['$q', 'DataProvider', 'mDialog', 'Connect', 'URL', 'Lang','Session', 'APP_POST','AppCoreUtilityServices'];

})();