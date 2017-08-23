;
(function() {
        "use strict";

        angular.module('app')
            .controller('OrgAnalysisViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog', '$timeout', 'Lang','Session', OrgAnalysisViewController])


        function OrgAnalysisViewController($scope, $stateParams, blockUI, DataProvider, Dialog, $timeout, Lang, Session) {

          console.log("In Org analysis controller");
          
          getAnalysisMenuList();

          function getAnalysisMenuList() {
            $scope.orgTabCtrl.optionMenuItems = [];
        }
        
    }


})();
