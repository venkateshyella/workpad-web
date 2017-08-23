
;(function() {
  "use strict";

  angular.module('Toolbar')
    .directive('viewToolbar', ViewToolbarDirective);

  function ViewToolbarDirective($compile, State, DrawerService, $Constant) {

    function preLink(scope, elem, attrs, ctrls) {
      var toolbarCtrl = ctrls[0];
      var viewCtrl = ctrls[1];
      
      elem.css(
    		  { 'height': '4em',
      'position': 'absolute',
      'top': 0,
      'width': '100%',
      'display': 'block',
      'background': '#285ebb',
      'color': '#ffffff',
      'z-index': 10});

      if(mobos.Platform.isIOS()) {
        elem.css({
          'height': viewCtrl.viewToolbarHeight+'em',
          'padding-top': $Constant.IOS_STATUS_BAR_HEIGHT+'em'
        });
      }

      viewCtrl.addViewToolbar(this, elem);
    }

    function postLink() {}

    function ToolbarController($scope) {
    }

    return {
      restrict: 'A',
      priority: 1,
      scope: true,
      require: ['toolbar', '^view'],
      link: {
        pre: preLink,
        post: postLink
      },
      controller: ['$scope', ToolbarController]
    }

  }
  ViewToolbarDirective.$inject = ['$compile', 'State', 'DrawerService', '$Constant']

})();