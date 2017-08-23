/**
 * Created by sudhir on 5/6/15.
 */


;(function() {

  angular.module('app.base-controllers')
    .controller('SelectListBaseController', SelectListBaseController)
  ;

  function SelectListBaseController($scope, $mdDialog) {

    var self = this;

    self.exposeSelectListScope = function exposeSelectListScope(scopeName) {
      if(scopeName) {
        $scope[scopeName].hide = self.hide;
        $scope[scopeName].cancel = self.cancel;
        $scope[scopeName].onListItemSelect = self.onListItemSelect;
      } else {
        $scope.hide = self.hide;
        $scope.cancel = self.cancel;
        $scope.onListItemSelect = self.onListItemSelect;
      }
    };

    self.hide = function hideDialog() {
      return $mdDialog.hide(arguments);
    };

    self.cancel = function cancelDialog() {
      return $mdDialog.cancel(arguments)
    };

    self.onListItemSelect = function onListItemSelect(item) {
      return self.hide(item);
    };

  }
  SelectListBaseController.$inject=['$scope', '$mdDialog'];

})();