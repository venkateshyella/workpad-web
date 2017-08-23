/**
 * Created by sudhir on 26/5/15.
 */

;(function() {
  "use strict";

  angular.module('app')
    .directive('userListItem', SimpeUserListItemDirective)
  ;

  function SimpeUserListItemDirective() {
    return {
      templateUrl: 'app/modules/user/fragment/user-simple-listItem.tpl.html'
    }
  }

})();
