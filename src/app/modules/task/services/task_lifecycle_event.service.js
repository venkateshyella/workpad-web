/**
 * Created by sudhir on 26/10/15.
 */

;
(function() {
    "use strict";

    angular.module('app')
        .service('TasLifeCycleService', [
            '$q', 'DataProvider', 'mDialog', 'blockUI', 'TASK_LIFECYCLE_EVENT',
            TasLifeCycleService
        ]);

    function TasLifeCycleService($q, DataProvider, Dialog, blockUI, TASK_LIFECYCLE_EVENT) {
        return {

            showTaskLifecycleEventTriggerDialog: showTaskLifecycleEventTriggerDialog

        };

        function showTaskLifecycleEventTriggerDialog(taskModel, lifecycleEvent) {


            return Dialog.show({
                controller: ['$scope', '$mdDialog', '$mdToast', 'State', 'Lang', 'taskModel', 'lifecycleEvent', 'TASK_LIFECYCLE_EVENT',
                    TaskStatusChangeDialogController
                ],
                templateUrl: 'app/modules/task/templates/task-lifecycle_event.dialog.tpl.html',
                locals: {
                    taskModel: taskModel,
                    lifecycleEvent: lifecycleEvent
                },
                clickOutsideToClose: false
            });

            function TaskStatusChangeDialogController($scope, $mdDialog, $mdToast, State, Lang, taskModel, lifecycleEvent, TASK_LIFECYCLE_EVENT) {
                $scope.LANG = Lang.en.data;
                $scope.lifecycleEvent = lifecycleEvent;
                $scope.taskModel = taskModel;
                
                $scope.submit = function submit() {
                    //In TaskSchema name of the function is in lower case 
                    var tryEventName = lifecycleEvent.toLowerCase();
                    taskModel[tryEventName]()
                        .then(function(res) {
                           $mdDialog.hide(res);
                        })
                        .catch(function(err) {
                            $mdDialog.cancel(err);
                        })
                        .finally(function() {});
                };

                $scope.cancel = function() {
                    $mdDialog.hide();
                };

            }

        }

    }

})();
