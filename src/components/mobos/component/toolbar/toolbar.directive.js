/**
 * Created by sudhir on 24/4/15.
 */

;
(function () {

  angular.module("Toolbar", ['ngTouch', 'ngMaterial'])
    .directive('toolbar', ToolbarDirective)
    .directive('toolbarHome', ToolbarHomeDirective)
    .directive('toolbarOptions', ToolbarOptionsDirective);

  /**
   * Toolbar directve
   *
   * Reference toolbar template
   *
   * <div class="toolbar-content">
   *
   *   <div class="toolbar-title-content">
   *
   *     <div class="menu-option-item">
   *       <div class="icon icon-menu"></div>
   *     </div>
   *
   *     <span class="toolbar-text toolbar-title">Toolbar title</span>
   *
   *    </div>
   *
   *    <div class="menu-options-container">
   *
   *      <div class="menu-option-group">
   *
   *        <div class="menu-option-item">
   *          <div class="icon icon-favorite"></div>
   *        </div>
   *
   *        <div class="menu-option-item thin">
   *          <div class="icon icon-more-vert"></div>
   *        </div>
   *
   *      </div>
   *    </div>
   *  </div>
   *
   */
  function ToolbarDirective($compile) {
    var TAG = '[Toolbar] ';

    var TYPE = {
      APP_BAR: 'appBar'
    };

    function preLink(scope, elem, attrs) {
      //console.info(TAG+'prelink');
      scope.attrs = attrs;
      elem.addClass('toolbar');
      scope.homeContentEl = elem.find('.toolbar-title-content');
      //scope.toolbarEl = elem.find('.app-toolbar>.md-toolbar-tools');
      scope.toolbarEl = angular.element($(elem[0]).find('.app-toolbar>.md-toolbar-tools')[0]);
      scope.optionsContainerEl = elem.find('.menu-options-container');

      //scope.toolbarProgressIndicator =
      //  angular.element($(elem[0]).find('.toolbar-loading-bar')[0]).length!=0 ||
      //  angular.element('<md-progress-linear md-mode="indeterminate"class="toolbar-loading-bar md-accent md-hue-3"></md-progress-linear>')
    }

    function postLink(scope, elem, attrs) {
      updateView(scope, elem);
    }

    function updateView(scope, elem) {
      scope.homeContentEl.empty();
      angular.forEach(scope.homeItems, function(homeItemEl) {
        scope.toolbarEl.append(homeItemEl);
      });

      scope.toolbarEl.append('<span flex></span>')

      angular.forEach(scope.optionItems, function(optionItemEl) {
        //scope.optionsContainerEl.append(optionItemEl);
        scope.toolbarEl.append(optionItemEl);
      });

      // Toolbar loading indicator
      //if(angular.element($(elem[0]).find('.toolbar-loading-bar').length==0)) {
      //  scope.toolbarEl.append(scope.toolbarProgressIndicator);
      //}

    }

    function ToolbarController($scope) {
      //console.log(TAG+'controller');

      $scope.homeItems = [];

      $scope.optionItems = [];
      var self = this;

      self.addHomeEl = function (el) {
        $scope.homeItems.push(el);
      };

      self.addOptionEl = function (el) {
        $scope.optionItems.push(el);
      };

      self.update = function() {
        console.info(tag+'updating..');
        updateView($scope);
      }
    }

    return {
      restrict: 'E',
      priority: 0,
      link: {
        pre: preLink,
        post: postLink
      },
      scope: true,
      transclude: true,
      templateUrl: function (tElement, tAttrs) {
        var templateUrl = '';
        switch (tAttrs) {
          case TYPE.APP_BAR:
            templateUrl = 'components/mobos/component/toolbar/toolbar.template.html';
            break;

          default:
        }
        return 'components/mobos/component/toolbar/toolbar.template.html'
      },
      controller: ['$scope', ToolbarController]
    }

  }

  ToolbarDirective.$inject = ['$compile'];


  function ToolbarHomeDirective() {
    var TAG = '[ToolbarHome] ';
    function preLink(scope, elem, attrs, toolbarCtrl) {
      toolbarCtrl.addHomeEl(elem.children());
    }

    function postLink(scope, elem, attrs, toolbarCtrl) {
    }

    return {
      restrict: 'E',
      require: '^toolbar',
      replace: true,
      link: {
        pre: preLink,
        post: postLink
      }
    }
  }

  ToolbarHomeDirective.$inject = [];


  function ToolbarOptionsDirective() {
    var TAG = '[ToolbarOption] ';
    function preLink(scope, elem, attrs, toolbarCtrl) {
      toolbarCtrl.addOptionEl(elem.children());
    }

    function postLink(scope, elem, attrs, toolbarCtrl) {
    }

    return {
      restrict: 'E',
      require: '^toolbar',
      link: {
        pre: preLink,
        post: postLink
      }
    }
  }

  ToolbarOptionsDirective.$inject = [];

})
();
