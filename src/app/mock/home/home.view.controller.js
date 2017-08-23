/**
 * Created by rihdus on 19/4/15.
 */

;(function() {

  angular.module('app')
    .controller('HomeViewController', HomeViewController);

  function HomeViewController($scope, State, Popup) {
    var TAG = '[HomeViewController] ';
    $scope.transitionTo = function(routeName) {
      State.transitionTo(routeName);
      console.log(routeName)
    };

    $scope.titleText = "Home toolbar";

    $scope.showSimpleMenu = function(e, align) {
      var menuItems = [
        {
          name: 'opt1',
          value: "First Option"
        },
        {
          name: 'opt2',
          value: "Second Option"
        },
        {
          name: 'opt3',
          value: "Third Option"
        }
      ];
      Popup.showMenu({
        targetEl: e.currentTarget || e.target,
        menuItems: menuItems,
        align: align
      }).then(function(option) {
        console.log(option);
      });
    };

    State.waitForTransitionComplete().then(function() {
    });

  }
  HomeViewController.$inject=['$scope', 'State', 'Popup'];

})();
