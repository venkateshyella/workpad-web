// user_info-directive.js

;
(function () {

  angular.module('User')
    .directive("userInfo", UserInfoDirective)

  function UserInfoDirective($timeout, Session, DataProvider, Connect, URL) {
    function _userInfoPreLink() {
    }

    function _userInfoPostLink(scope, element, attrs) {
      // Directive on link complete function.

      if (!scope.userId && !scope.userInfo) {
        console.error("no user object or user id available.")
      }
      else if (scope.userId) {
        var userData = DataProvider.resource.User.get(scope.userId);
        if (angular.isDefined(userData)) {
          scope.user = DataProvider.resource.User.get(scope.userId);
        } else {
          DataProvider.resource.User.find(scope.userId, {
            adapter: 'WWHttpAdapter'
          }).then(function onUserFindSuccess(resp) {
            scope.user = DataProvider.resource.User.get(scope.userId);
          }, function onUserFindError() {
            scope.STATE_LOAD_FAILED = true;
          })
        }
      } else if(scope.userName){

      }
    }

    return {

      restrict: "A",
      scope: {
        // scope user object
        userInfo: "=?",
        userId: "=?",
        hideInfo: '=?',
        userName: '=?',
        // scope Options
        editable: '=?'
      },
      link: {
        pre: _userInfoPreLink,
        post: _userInfoPostLink
      },
      templateUrl: function (tElement, tAttrs) {
        return 'components/user/user-info-partial.view.html';
      },
      controller: ['$scope', function (scope) {
        //  Directive functions
      }]
    }
  }

  UserInfoDirective.$inject = ['$timeout', 'Session', 'DataProvider', 'Connect', 'URL'];

})();
