/**
 * Created by sudhir on 8/10/15.
 */

;
(function() {
    "use strict";

    angular.module('app')
        .controller('CheckBoxFormPartialViewController', ['$scope', '$stateParams',
            'DataProvider',
            CheckBoxFormPartialViewController
        ]);

    function CheckBoxFormPartialViewController($scope, $stateParams, DataProvider) {

        var formFieldTemp = angular.copy($scope.formField);

      //  var fieldModel = formField.templateOptions.fieldModel;

     // $scope.formField.keyValue = formField.templateOptions.fieldModel.checkBoxListData;
    }

})();
