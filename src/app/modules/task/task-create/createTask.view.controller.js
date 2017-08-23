;
(function() {
    "use strict";

    angular.module('app')
        .controller('CreateTaskViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', CreateTaskViewController])

    ;

    function CreateTaskViewController($scope, $stateParams, blockUI, DataProvider) {



        $scope.form = {};
        $scope.formModel = {};
        $scope.jobModel ={};
        $scope.cancel = function cancel() {

            $scope.transitionTo('root.app.job-view.jobProfile', {
                jobId: $stateParams.jobId
            });

        }


       var JobData = DataProvider.resource.Job.get($stateParams.jobId);

            

         $scope.jobModel.JobTitle = JobData.title;

        $scope.submit = function submit() {

            blockUI.start($scope.LANG.TASK.TASK_LOADING_MSGS.TASK_CREATE, {
                status: 'isLoading'
            });

            DataProvider.resource.Task.create({
                    jobId: $stateParams.jobId,
                    title: $scope.formModel.title,
                    desc: $scope.formModel.desc

                })
                .then(function(TaskModel) {
                    console.log(TaskModel);
                    blockUI.stop("Successfully Created", {
                        status: 'isSuccess'
                    });

                    $scope.transitionTo('root.app.job-view.jobProfile', {
                        jobId: $stateParams.jobId
                    });

                })
                .catch(function(error) {

                })
                .finally(function() {
                    blockUI.stop();
                });
        };

    }

})();
