;
(function() {
    "use strict";

    angular.module('app')
        .controller('UpdateTaskViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', '$timeout', UpdateTaskViewController])

    ;

    function UpdateTaskViewController($scope, $stateParams, blockUI, DataProvider, $timeout) {

        $scope.form = {};
        $scope.formModel = {};
        $scope.TaskModel = {};
        $scope.resetTaskFormModel = resetTaskFormModel;

        getTaskDetails();


        $scope.submit = function submit() {

            blockUI.start($scope.LANG.TASK.TASK_LOADING_MSGS.TASK_UPDATE, {
                status: 'isLoading'
            });


            /*
            resource.Task.update(1,{"id" : 1,
            "jobId": 9,
            "title": "NewTask­2",
            "description": "My new task­1",
            "priority" : 0});*/

            DataProvider.resource.Task.update($stateParams.taskId, {
                    id: $stateParams.taskId,
                    jobId: $stateParams.jobId,
                    title: $scope.formModel.title,
                    desc: $scope.formModel.desc,
                    priority  : 0
                })
                .then(function(TaskModel) {
                    console.log(TaskModel);
                   // $scope.TaskModel = angular.copy(TaskModel);
                    $scope.form.updateTaskCtrl.$setPristine();
                })
                .catch(function(error) {})
                .finally(function() {
                    $timeout(function() {
                        blockUI.stop();
                    }, 1000);

                }); 


        };


        function getTaskDetails() {
            /*DataProvider.resource.Task.find(
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
              });*/
        }

        function resetTaskFormModel() {


            $scope.formModel = angular.copy($scope.TaskModel);
            $scope.form.updateTaskCtrl.$setPristine();

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
