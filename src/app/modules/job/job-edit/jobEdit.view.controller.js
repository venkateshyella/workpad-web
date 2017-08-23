;
(function () {
  "use strict";

  angular.module('app')
    .controller('JobEditViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', '$timeout', JobEditViewController])

  ;

  function JobEditViewController($scope, $stateParams, blockUI, DataProvider, $timeout) {

    $scope.form = {};
    $scope.formModel = {};
    $scope.JobModel = {};
    $scope.resetJobFormModel = resetJobFormModel;

    getJobDetails();


    $scope.submit = function submit() {

      blockUI.start($scope.LANG.JOB.JOB_LOADING_MSGS.JOB_UPDATE, {
        status: 'isLoading'
      });

      DataProvider.resource.Job.update($stateParams.jobId, {
        orgId: 1524,
        id: $scope.formModel.id,
        title: $scope.formModel.title,
        desc: $scope.formModel.desc,
        objective: $scope.formModel.objective
      })
        .then(function (JobModel) {
          console.log(JobModel);
          $scope.JobModel = angular.copy(JobModel);
          $scope.form.edit_job.$setPristine();
        })
        .catch(function (error) {
        })
        .finally(function () {
          $timeout(function () {
            blockUI.stop();
          }, 1000);

        });


    };


    function getJobDetails() {
      DataProvider.resource.Job.find(
        $stateParams.jobId
      )
        .then(function (JobModel) {
          console.log(JobModel);
          $scope.formModel = JobModel;
          $scope.JobModel = angular.copy(JobModel);
          $timeout(function () {
          });

        })
        .catch(function (error) {
        })
        .finally(function () {
          blockUI.stop();
        });
    }

    function resetJobFormModel() {

      $scope.formModel = angular.copy($scope.JobModel);
      $scope.form.edit_job.$setPristine();

    }


    /*var requestObj = {
     "orgId":$stateParams.orgId,
     "title":$scope.formModel.name,
     "description":$scope.formModel.desc,
     "objective":$scope.formModel.objective
     }*/

//call to service with request object


  };


})();