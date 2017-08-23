/**
 * Created by sudhir on 17/9/15.
 */

;
(function () {
  "use strict";

  angular.module('app')
    .service('jobLifecycleEventService', [
      'JobAdvertisement', 'JobAdvertisementFactory',
      '$q', 'mDialog', 'blockUI',
      'Connect', 'URL', 'Lang',
      'JOB_LIFECYCLE_EVENT', 'DataProvider',
      jobLifecycleEventService
    ])
  ;

  function jobLifecycleEventService(JobAdvertisement, JobAdvertisementFactory
    , $q, Dialog, blockUI, Connect, URL, Lang
    , JOB_LIFECYCLE_EVENT, DataProvider) {

    var LANG = Lang.en.data;
    return {
    
      showJobLifecycleEventTriggerDialog: showJobLifecycleEventTriggerDialog,
     
    };

   
    

    function showJobLifecycleEventTriggerDialog(jobModel, event) {





      return Dialog.show({
        controller: ['$scope', '$mdDialog', '$mdToast'
          , 'State', 'Lang', 'jobModel', 'lifecycleEvent'
          , 'JOB_LIFECYCLE_EVENT',
          JobStatusChangeDialogController],
        templateUrl: 'app/modules/job/templates/job-lifecycle_event.dialog.tpl.html',
        locals: {
          jobModel: jobModel,
          lifecycleEvent: event
        },
        clickOutsideToClose: false
      });

      function JobStatusChangeDialogController($scope, $mdDialog, $mdToast
        , State, Lang, jobModel, lifecycleEvent
        , JOB_LIFECYCLE_EVENT) {
        $scope.LANG = Lang.en.data;
        $scope.JOB_LIFECYCLE_EVENT = JOB_LIFECYCLE_EVENT;
        $scope.lifecycleEvent = lifecycleEvent;
        $scope.jobModel = jobModel;
        $scope.form = {};
        $scope.formModel = {};
        $scope.formModel.jobStatusChange = {};
        $scope.formModel.isAcknowledged = false;

        $scope.toggleisAcknowledgedFlag = toggleisAcknowledgedFlag;

        function toggleisAcknowledgedFlag(){
           $scope.formModel.isAcknowledged = !$scope.formModel.isAcknowledged;
        }


        $scope.flag = {
          isFetchingForms: false,
          isLifeCycleUpdateInProgress: false
        };
        $scope.fetchError = null;

        $scope.isFormVisiable = (lifecycleEvent == "TRY_FINISH");
        $scope.showFormSubmissionDialog = function showFormSubmissionDialog(formModel) {
          showFormSubmitDialog(formModel);
        };
        $scope.getUnsubmittedForms = getUnsubmittedForms;

        $scope.cancel = function () {
          $mdDialog.hide();
        };
        $scope.submit = function submit() {
          var comment = $scope.formModel.comment;

          blockUI.start('Updating Job..');
          $scope.flag.isLifeCycleUpdateInProgress = true;
          var disclaimerMessage = $scope.formModel.disMsg;
          var acknowledgement = $scope.formModel.isAcknowledged;
          $scope.jobModel[lifecycleEvent.toLocaleLowerCase()](disclaimerMessage,acknowledgement)
            .then(function (res) {
              $mdDialog.hide(res);
              blockUI.stop();
              var toast = $mdToast.simple()
                .content(res.respMsg)
                .position('bottom right')
                .hideDelay(4000);
              $mdToast.show(toast)
                .then(function (res) {
                })
            })
            .catch(function (err) {
              blockUI.stop(err.respMsg, {
                status: 'isError',
                action: LANG.BUTTON.OK
              });
              $mdDialog.hide(err);
            })
            .finally(function () {
              $scope.flag.isLifeCycleUpdateInProgress = false;
            });
        };
        $scope.isOkToSubmit = function () {
          return !$scope.flag.isLifeCycleUpdateInProgress
            && $scope.form.jobStatusChange.$valid
            && (
              jobModel.countFormsByFilter({
                isSubmitted: false,
                triggerCode: JOB_LIFECYCLE_EVENT[lifecycleEvent]
              }) == 0
            )
            && !$scope.flag.isFetchingForms
            && !$scope.flag.status_formFetchFail
            ;
        };
        $scope.fetchForms = _fetchForms;

      //  _fetchForms();

        function _fetchForms() {
          $scope.flag.isFetchingForms = true;
          $scope.flag.status_formFetchFail = false;
          return jobModel.loadForms()
            .then(function (res) {
              $scope.flag.status_formFetchFail = false;
            })
            .catch(function (err) {
              $scope.flag.status_formFetchFail = true;
              $scope.fetchError = err.respMsg;
            })
            .finally(function () {
              $scope.flag.isFetchingForms = false;
            })
            ;
        }

        function getUnsubmittedForms() {
          return $scope.jobModel.getFormsByFilter({
            triggerCode: JOB_LIFECYCLE_EVENT[lifecycleEvent],
            isSubmitted: 0
          });
        }
      }

    }

  }

})();