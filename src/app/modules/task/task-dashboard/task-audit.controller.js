/**
 * Created by sudhir on 8/6/16.
 */

angular.module('app')
  .controller('TaskAuditViewController', ['$scope', '$stateParams',
    'TaskService', 'Lang',
    function ($scope, $stateParams, TaskService, Lang) {
      "use strict";

      var LANG = Lang.data
        , taskId = $stateParams.taskId
        ;

      $scope.taskAuditCollection = [];
      $scope.taskAuditPageLoader = TaskService
        .createTaskVaultAuditListLoader(taskId, $scope.taskAuditCollection);

    }
  ]);