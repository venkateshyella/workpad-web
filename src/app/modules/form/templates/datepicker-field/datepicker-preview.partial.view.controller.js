;
(function() {
    "use strict";

    angular.module('app')
        .controller('DatePickerFormPreviewViewController', ['$scope', '$stateParams',
            'DataProvider',
            DatePickerFormPreviewViewController
        ]);

    function DatePickerFormPreviewViewController($scope, $stateParams, DataProvider) {

        $scope.field_temp = angular.copy($scope.field);

            if($scope.field.validation.datetime.dateOnly && $scope.field_temp.keyValue) {

                $scope.field_temp.keyValue = new Date($scope.field_temp.keyValue);
            }
            else{
              $scope.field_temp.keyValue  =  new Date();
            }
    }

})();