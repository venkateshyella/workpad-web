;
(function () {
  "use strict";

  angular.module('app')
    .controller('UserSelectController', UserSelectController);

  function UserSelectController($scope, $timeout, $stateParams,
                                LayoutProviderService, Session, DataProvider,
                                ActivityManager, DialogActivityFactory, LANG,
                                Connect, URL) {
    var TAG = "UserViewController";

    function run() {
      if (angular.isDefined($stateParams.id)) {
        var userId = $stateParams.id;
        $scope.userId = userId;

        refreshScope();

        $timeout(function () {
          addToolbarOptions();
        }, 100);
      }
    }

    function refreshData() {
      var userId = $stateParams.id;
      if (userId) {
        return DataProvider.resource.User.find(userId)
      } else {
        return null;
      }
    }

    function refreshScope(options) {
      var options = options || {}
      var userId = $stateParams.id;
      if (!userId) {
        return;
      }
      if (options.clearCache || !DataProvider.resource.User.get(userId)) {
        refreshData().then(function onRefreshSuccess() {
          $scope.user = DataProvider.resource.User.get(userId)
        }, function onRefreshError() {
          $scope.user = {};
        });
      } else {
        $scope.user = DataProvider.resource.User.get(userId)
        console.log($scope.user);
      }
      $scope.ui = {
        profileTab: {
          currTab: 'info'
        }
      }
    }

    function addToolbarOptions() {
      var userViewToolbar = LayoutProviderService('userSelectViewToolbar');
      if (userViewToolbar) {
        userViewToolbar.addOptionsMenu('userSelectOption', {
          text: 'Select',
          icon: 'icon icon-add',
          onOptionItemClick: function () {
            console.log("Selecting this user");
            addToOrganisation($stateParams.id, $stateParams.orgId);
          }
        });
      }
    }

    // Create a post to invite a user to an organisation
    function addToOrganisation(userId, orgId) {
      Connect.post(URL.CREATE_POST,
        {
          desc: "Invite to org",
          postType: "ORG",
          userId: Session.userId+"",
          data: [
            {
              "orgId": orgId+'',
              "groupId": "0",
              "jobId": "0",
              "toUser": userId+''
            }
          ]
        }
      ).then(function onInviteSuccess(result) {
          console.log(result);
          ActivityManager.startActivity(DialogActivityFactory, {
            type: "alert",
            title: "Add to WorkSpace",
            content: result.respMsg,
            ok: "Ok"
          }).then(function() {
            $scope.resetNavigationTo('root.app.user-orglist', {
              id: Session.userId
            })
          });
        }, function onInviteFail(error) {
          console.log(error);
          ActivityManager.startActivity(DialogActivityFactory, {
            type: "alert",
            title: "Add to WorkSpace",
            content: error.respMsg,
            ok: "Ok"
          });
        });
    }

    run();

  }

  UserSelectController.$inject = [
    '$scope', '$timeout', '$stateParams',
    'LayoutProviderService', 'Session', 'DataProvider',
    'ActivityManager', 'DialogActivityFactory', 'LanguageProvider',
    'Connect', 'URL'];

})
();