/**
 * Created by sudhir on 4/5/15.
 */

;(function() {

  angular.module('Tabs')
    .directive('tab', TabDirective);

  function TabDirective($compile) {
    return {
      restrict: "EA",
      require: ['tab', '^tabs'],
      controller: ['$scope', '$element', '$timeout', '$compile', '$animate', TabItemController],
      link: { pre: preLink, post: postLink },
      scope: {
        onSelect: '&onSelect',
        onDeselect: '&onDeselect',
        label: '@'
      }
    };

    function postLink(scope, elem, attrs, ctrls) {
      //console.log('tabItem postlink');
      var tabCtrl = ctrls[0];
      var tabsCtrl = ctrls[1];


      tabsCtrl.add(tabCtrl);

      var taLabel;
    }

    function preLink(scope, elem, attrs, ctrls) {
      //console.log('tabItem prelink');
      var tabCtrl = ctrls[0];
      var tabsCtrl = ctrls[1];

      elem.addClass('tab-content');

      var taLabel = angular.element('<div class="button button-tab"></div>');
      var taLabelContent = '';

      if(attrs.label) {
        taLabelContent = angular.element('<span class="tab-label">'+attrs.label+'</span>');
      }

      if(attrs.icon) {
        taLabel.addClass('icon-center '+attrs.icon);
      }

      if(attrs.iconBefore) {
        taLabel.addClass('icon-left '+attrs.iconBefore);
      }

      if(attrs.iconAfter) {
        taLabel.addClass('icon-right '+attrs.iconAfter);
      }

      taLabel.append(angular.element(taLabelContent));

      tabCtrl.label = taLabel;

    }
  }
  TabDirective.$inject=['$compile'];

  function TabItemController($scope, $element, $timeout, $compile, $animate) {
    //console.log("tabItem controller");

    var self = this;
    self.element = $element;

    self.onAdd = onAdd;
    self.onMove = onMove;
    self.onRemove = onRemove;
    self.onSelect = onSelect;
    self.onDeselect = onDeselect;

    function onAdd(position) {
      switch (position) {
        case 0:
          position = 'active';
          break;
        case -1:
          position = 'content-left';
          break;
        case 1:
        default:
          position = 'content-right';
      }
      $element.addClass(position);
    }

    function onRemove() {}

    function onMove(toRight) {
      $element
        .removeClass('transitioning')
        .removeClass('content-right')
        .removeClass('content-left')
        .addClass(toRight ? 'content-right':'content-left');
    }

    function onSelect(toRight) {
      //console.log('onSelect: '+self.label.html()+' from '+(toRight?'right to left':'left to right'));

      $element
         //add animation class
        .addClass('transitioning');

      $scope.onSelect();

      return $animate.addClass($element, 'active');

    }

    function onDeselect(toRight) {
      //console.log('onSelect');
      $element
        .removeClass('active')
        .removeClass('content-right')
        .removeClass('content-left')
        .addClass('transitioning')
        .addClass(toRight ? 'content-left':'content-right');

      //$animate.removeClass($element, 'ng-hide');

      $scope.onDeselect();
    }

  }

})();
