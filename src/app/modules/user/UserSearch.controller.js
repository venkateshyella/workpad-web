;
(function () {
  "use strict";

  angular.module('app')
    .controller('UserSearchController', UserSearchController);

  function UserSearchController($scope, $rootScope, $timeout, $stateParams,
                                DataProvider,
                                ActivityManager) {

    function updateUserList(searchtext) {
      DataProvider.resource.User.findAll({
        userName: searchtext
      }, {
        bypassCache: true
      }).then(function (result) {
        var searchResultResp = result;
        $timeout(function() {
          $scope.data.searchResults = DataProvider.resource.User.getAll(_.pluck(searchResultResp, 'id'));
        },0);
      });
    }

    function onSearchTextChange() {
      updateUserList($scope.searchtext);
    }

    function attachWatchers() {
      $scope.$watch('searchtext', function (val) {
        console.log($scope.searchtext);
        console.log(val);
      }, true);
    }

    function initScope() {
      $scope.form = {};
      $scope.searchText = "";
      $scope.data = {};

      if($stateParams.orgId) {
        $scope.orgId = $stateParams.orgId;
      }

      $scope.updateUserList = updateUserList;
      $scope.onSearchTextChange = onSearchTextChange;
      $scope.onSearchItemClick = onSearchItemClick;
    }

    function onSearchItemClick(userId) {
      if($stateParams.orgId) {
        $scope.startTransition('root.app.user-select-org', {id:userId, orgId: $stateParams.orgId});
      } else { /* Do Nothing */ }
    }

    function run() {
      initScope();
      updateUserList("");

    }

    if($rootScope._initialized) {
      run();
    }

  }

  UserSearchController.$inject = ['$scope', '$rootScope', '$timeout', '$stateParams',
    'DataProvider',
    'ActivityManager'];

})();