/**
 * Created by rihdus on 2/5/15.
 */

;(function() {

  angular.module('app')
    .controller('TabsViewController', TabsViewController);

  function TabsViewController($scope, State) {

    var count = 1;
    $scope.tab1Content = "this is tab 1 content.";

    $scope.tab_content = "tab1";

    $scope.onTab1ContentClick = function() {
      $scope.tab1Content = "tab 1 content updated "+count++;
    }

    $scope.onTabSelect = function(name) {
      //console.log("tab: "+name+" selected");
    }

  }
  TabsViewController.$inject=['$scope', 'State'];

})();
