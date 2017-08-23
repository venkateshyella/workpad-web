;
(function () {
  "use strict";

  angular.module('app')
    .controller('CreateJobViewController',['$scope','$stateParams','blockUI','DataProvider','mDialog', CreateJobViewController])
    
  ;

function CreateJobViewController($scope,$stateParams,blockUI,DataProvider,mDialog){

$scope.form = {};
$scope.formModel = {};

$scope.cancel = function cancel(){

     $scope.transitionTo('root.app.org-dashboard.orgInfo', {

            orgId : $stateParams.orgId
            
          });

}
$scope.submit = function submit(){

   blockUI.start($scope.LANG.JOB.JOB_LOADING_MSGS.JOB_CREATE, {
    status: 'isLoading'
   });

  /*var requestObj = {
  "orgId":$stateParams.orgId,
  "title":$scope.formModel.name,
  "description":$scope.formModel.desc,
  "objective":$scope.formModel.objective
  }*/

//call to service with request object

DataProvider.resource.Job.create({
      orgId:$stateParams.orgId,
      title:$scope.formModel.name,
      desc:$scope.formModel.desc,
      objective:$scope.formModel.objective
     })
     .then(function(JobModel) {
       console.log(JobModel);

      if(JobModel && JobModel.id) {
        return $scope.transitionTo('root.app.job-view.jobProfile', {
          jobId: JobModel.id
        });
      }
      else{
        mDialog.alert("Job Creation Failed.");
      }

     })
     .catch(function(error) {
      
      mDialog.alert(error.respMsg);

     })
     .finally(function(response){
      blockUI.stop("stopped", {
                  status: 'isSuccess'
                });
     });
};

}

})();