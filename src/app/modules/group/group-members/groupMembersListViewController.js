/**
 * Created by sudhir on 30/7/15.
 */

;
(function () {
  "use strict";

  angular.module('app')
    .controller('GroupMembersListViewController', [
      '$scope', '$controller',
      'State', '$stateParams',
      '$timeout', 'mDialog', 'blockUI',
      'UserInvitationService',
      'DataProvider', 'URL',
      GroupMembersListViewController
    ])
  ;

  function GroupMembersListViewController($scope, $controller,
                                          State, $stateParams,
                                          $timeout, Dialog, blockUI,
                                          UserInvitationService,
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
      groupMemberLoader: self.initializeViewDataBaseController('groupMembers', fetchGroupMembers),
      group: self.initializeViewDataBaseController('grpDetails', fetchGrpDetails, findGrpDetails),
    };

    $scope.loadNextPage = loadNextPage;
    $scope.showGroupMemberOptions = showGroupMemberOptions;
    $scope.ui = {
      loadingNext: false,
      refreshing: false,
      isNextPageAvailable: false
    };


    refresh();

    function resetPage() {
      $scope.data.groupPageCtx = {
        currentPage: 1,
        pageSize: 25,
        nextPage: 2
      }
    }

    function refresh() {
      resetPage();
      $scope.data.group = findGrpDetails();
      $scope.ui.refreshing = true;
      $scope.groupMembers.refresh()
        .then(function (res) {
          $scope.data.groupMembers = self.viewData.groupMemberLoader.groupMembers.data;
          var rawResult = DataProvider.resource.User.result
            , paginationData = rawResult.resp.paginationMetaData
            ;

          $scope.isNextPageAvailable = $scope.data.groupMembers.length < paginationData.totalResults;
        })
        .catch(function () {
        })
        .finally(function () {
          $scope.ui.refreshing = false;
        })
      ;
    }

    function loadNextPage() {
      $scope.ui.loadingNext = true;
      fetchGroupMembers({
        pageNumber: $scope.data.groupPageCtx.currentPage + 1
      })
        .then(function (res) {
          $scope.data.groupMembers = $scope.data.groupMembers.concat(self.viewData.groupMemberLoader.groupMembers.data);
          $scope.data.groupMembers = _.uniq($scope.data.groupMembers, function (user) {
            return user.id
          });
          $scope.data.groupPageCtx.currentPage = $scope.data.groupPageCtx.nextPage;
          $scope.data.groupPageCtx.nextPage++;
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

    function fetchGroupMembers(pageCtx) {
      var params = {
        grpId: $stateParams.groupId,
        groupParentId: $stateParams.parentId,
        pageSize: $scope.data.groupPageCtx.pageSize,
        pageNumber: pageCtx.pageNumber || 1
      };
      return DataProvider.resource.User.findAll(params, {
        url: URL.GROUP_MEMBERS,
        bypassCache: true
      });
    }

    function askAndRemoveGroupMember(user, group) {
      return Dialog.confirm({
        title: "Remove User",
        content: 'Do you wish to remove ' + user.userFirstName + ' ' + user.userLastName + ' from this room?',
        ok: "Remove",
        cancel: "Cancel"
      }).then(function (res) {
        var intent = {
          org: DataProvider.resource.Organisation.get($stateParams.orgId),
          group: $scope.data.group
        };
        blockUI.start("Removing User..");
        UserInvitationService.ejectUserFromGroup(user, intent)
          .then(function (resp) {
            Dialog.alert(resp.respMsg);
            refresh({bypassCache: true})
          })
          .catch(function (error) {
            Dialog.alert(error.respMsg)
          })
          .finally(function () {
            blockUI.reset();
          })
      })
    }

    function showGroupMemberOptions(user, $event) {
      if ($scope.data.group.adminId == $scope.session.userId
        && $scope.data.group.adminId != user.id) {
        // Current user is the admin of the group
        // Group admin options
        // - delete user
        // - view user profile
        Dialog.showListDialog([{
          text: "View Profile",
          value: "profile"
        }, {
          text: "Remove User",
          value: "remove"
        }], {
          $event: $event
        }).then(function (select) {
          switch (select.value) {
            case 'profile':
              State.transitionTo('root.app.user', {
                id: user.id
              });
              break;
            case 'remove':
              askAndRemoveGroupMember(user)
                .then(function (res) {
                  refresh({bypassCache: true});
                });
              break;
          }
        });
      } else {
        // User not admin of the group.
        // Group member actions.

        $scope.transitionTo('root.app.user', {
          id: user.id
        });
      }
    }

  }

})();
