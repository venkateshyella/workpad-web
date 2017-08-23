/**
 * Created by sudhir on 8/10/15.
 */

;
(function() {
    "use strict";

    angular.module('app')
        .controller('DatePickerFormPartialViewController', ['$scope', '$stateParams',
            'DataProvider',
            DatePickerFormPartialViewController
        ]);

    function DatePickerFormPartialViewController($scope, $stateParams, DataProvider) {

        $scope.formField_temp = angular.copy($scope.formField);

        $scope.dateChangeEvent = function(dateValue){
           // $scope.formField.keyValue = (dateValue.getMonth() + 1) + "/" + dateValue.getDate() + "/" + dateValue.getFullYear();

            $scope.formField.keyValue = dateValue.toISOString();
            if($scope.formField.validation.datetime.dateOnly) {
                $scope.formField.keyValue = $scope.formField.keyValue.substring(0, 10);
            }

            $scope.fieldCtrl.getFormFieldError();
        }
    }

})();
