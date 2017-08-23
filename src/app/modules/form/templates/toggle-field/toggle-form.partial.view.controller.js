/**
 * Created by sudhir on 8/10/15.
 */

;
(function() {
    "use strict";

    angular.module('app')
        .controller('ToggleFormPartialViewController', ['$scope', '$stateParams',
            'DataProvider',
            ToggleFormPartialViewController
        ]);

    function ToggleFormPartialViewController($scope, $stateParams) {

       /* var formField = angular.copy($scope.formField);

        var fieldModel = formField.templateOptions.fieldModel;

        $scope.formField.keyValue =  formField.templateOptions.fieldModel.switchValue;*/

        $scope.formField.keyValue = false;


    }

})();
