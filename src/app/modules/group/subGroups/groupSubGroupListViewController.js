/**
 * Created by sudhir on 11/8/15.
 */

;
(function () {
  "use strict";

  angular.module('app')
    .controller('GroupSubGroupListViewController', [
      '$scope', '$controller', '$stateParams',
      '$timeout', 'mDialog',
      'DataProvider', 'URL',
      GroupSubGroupListViewController
    ])
  ;

  function GroupSubGroupListViewController($scope, $controller, $stateParams,
                                           $timeout, Dialog,
                                           DataProvider, URL) {

    var self = this;

    angular.extend(self, $controller('ViewDataBaseController', {$scope: $scope}));
    $scope.data = {
      groupMembers: [],
      groupPageCtx: {
        currentPage: 1,
        pageSize: 25,
        nextPage: 2
      }
    };
    self.viewData = {
      groupSubGroupLoader: self.initializeViewDataBaseController('groupSubGroup', fetchGroupSubgroups),
      group: self.initializeViewDataBaseController('grpDetails', fetchGrpDetails, findGrpDetails)
    };

    $scope.loadNextPage = loadNextPage;
    $scope.showSubGroupOptions = showSubGroupOptions;
    $scope.ui = {
      loadingNext: false,
      refreshing: false,
      isNextPageAvailable: false
    };


    refresh();

    function resetPage() {
      $scope.data.groupPageCtx = {
        currentPage: 0,
        pageSize: 25,
        nextPage: 1
      }
    }

    function refresh() {
      resetPage();
      $scope.data.group = findGrpDetails();
      $scope.ui.refreshing = true;
      $scope.groupSubGroup.refresh()
        .then(function (res) {
          $scope.data.groupSubGroup = self.viewData.groupSubGroupLoader.groupSubGroup.data;
          $scope.data.groupPageCtx.currentPage = $scope.data.groupPageCtx.nextPage;
          $scope.data.groupPageCtx.nextPage++;
          updatePagination();
        })
        .catch(function () {
        })
        .finally(function () {
          $scope.ui.refreshing = false;
        })
      ;
    }

    function updatePagination() {
      var rawResult = DataProvider.resource.Group.result
        , paginationData = rawResult.resp.paginationMetaData
        ;

      $scope.ui.isNextPageAvailable = $scope.data.groupSubGroup.length < paginationData.totalResults;
    }

    function loadNextPage() {
      $scope.ui.loadingNext = true;
      $scope.groupSubGroup.refresh()
        .then(function (res) {
          $scope.data.groupSubGroup = $scope.data.groupSubGroup.concat(self.viewData.groupSubGroupLoader.groupSubGroup.data);
          $scope.data.groupSubGroup = _.uniq($scope.data.groupSubGroup, function (group) {
            return group.id
          });

          $scope.data.groupPageCtx.currentPage = $scope.data.groupPageCtx.nextPage;
          $scope.data.groupPageCtx.nextPage++;
          updatePagination();
        })
        .catch(function () {
        })
        .finally(function () {
          $timeout(function () {
            $scope.ui.loadingNext = false;
          });
        })
      ;
    }

    function fetchGrpDetails(options) {
      options = options || {};
      options.bypassCache = true;
      return DataProvider.resource.Group.find($stateParams.groupId, options)
    }

    function findGrpDetails(options) {
      return DataProvider.resource.Group.get($stateParams.groupId)
    }

    function fetchGroupSubgroups(pageCtx) {
      var options = options || {}
        , pageCtx = pageCtx || {}
        ;
      options.bypassCache = true;
      var params = {
        orgId: $stateParams.orgId,
        userId: $scope.session.userId,
        groupParentId: $scope.data.group.id,

        pageNumber: $scope.data.groupPageCtx.nextPage,
        pageSize: $scope.data.groupPageCtx.pageSize
      };
      return DataProvider.resource.Group.findAll(params, options);
    }

    function showSubGroupOptions(group, $event) {
      $scope.transitionTo('root.app.group', {
        orgId: $stateParams.orgId,
        groupId: group.groupId
      });
    }

  }

})();
