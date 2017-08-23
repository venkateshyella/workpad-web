/**
 * Created by sudhir on 8/10/15.
 */

;
(function() {
    "use strict";

    angular.module('app')
        .controller('ToggleFieldViewController', ['$scope', '$stateParams',
            'DataProvider', 'mDialog',
            ToggleFieldViewController
        ]);

    function ToggleFieldViewController($scope, $stateParams, DataProvider, Dialog) {

        $scope.fieldModel.switchValue = true;
        $scope.toggleChangeEvent = function(){
        $scope.formField.keyValue = angular.copy($scope.fieldModel.switchValue);
        }

    }

})();
