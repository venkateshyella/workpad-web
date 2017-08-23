/**
 * Created by rihdus on 26/4/15.
 */

;(function() {

  angular.module('app')
    .controller('DialogsViewController', DialogsViewController);

  function DialogsViewController($scope, State, Dialog) {

    var TAG = '[DialogsViewController] ';

    $scope.showSimpleAlert = function(e) {
      //Dialog.showAlert("Hello").then(function() {
      //  console.log("Alert Ok");
      //});
      Dialog.show(
        Dialog.alert({
          title: "Hello!",
          content: "Simple alert",
          okText: "Got It",
          okType: "button-positive",
          clickOutsideToClose: true
        })
      ).then(function() {
        console.log("Alert Ok");
      });
    };

    $scope.showConfirm = function(e) {
      //Dialog.showAlert("Hello").then(function() {
      //  console.log("Alert Ok");
      //});
      Dialog.show(
        Dialog.confirm({
          title: "Hello!",
          content: "How are you doing today?",
          okText: "Awesome",
          okType: "button-positive",
          cancelText: "Super",
        })
      ).then(function() {
          $scope.myMoodToday = "awesome"
        }, function() {
          $scope.myMoodToday = "super"
        });
    };

    $scope.showCustomDialog = function(e) {

      Dialog.show({
        templateUrl: 'components/mobos/component/dialog/customDialog.template.html',
        controller: ['$scope', 'mDialog', CustomDialogController],
        controllerAs: 'dialog',
        bindToController: true,
      }).then(function(response) {
        console.log("response: "+response);
      });

      function CustomDialogController($scope, dialog) {

        $scope.customAction = function() {
          dialog.hide('custom response');
        }

        $scope.customAction2 = function() {
          dialog.hide('custom response 2');
        }
      }
    };

    State.waitForTransitionComplete().then(function() {
    })
  }
  DialogsViewController.$inject = ['$scope', 'State', 'Dialog'];

})();
