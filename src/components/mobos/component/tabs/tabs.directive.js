/**
 * Created by sudhir on 4/5/15.
 */

;
(function () {

  angular.module('Tabs')
    .directive('tabs', TabsDirective);

  function TabsDirective() {
    return {
      restrict: "EA",
      templateUrl: "components/mobos/component/tabs/tabs.tpl.html",
      link: {pre: preLink, post: postLink},
      scope: true,
      transclude: true,
      controller: ['$scope', '$element', '$timeout', '$Util', '$compile', TabsController]
    };

    function postLink(scope, elem, attrs, tabsCtrl, transclude) {
      //console.log('tabs postlink');

    }

    function preLink(scope, elem, attrs) {
      //console.log('tabs prelink');
      var self = this;
      scope.selectedIndex = attrs.selectedIndex;

      self.tabBarContainer;
    }

    function TabsController($scope, $element, $timeout, $Util, $compile) {
      //console.log("tab controller");
      var tabsList = $Util.iterator([], false);
      var self = this;

      var inRange = self.inRange = tabsList.inRange;
      var indexOf = self.indexOf = tabsList.indexOf;
      var itemAt = self.itemAt = tabsList.itemAt;

      self.$element = $element;
      self.tabList = tabsList;
      self.select = select;
      self.add = addTab;

      $scope.$onTabLabelClick = onTabLabelClick;


      var tabBarContainer = self.tabBarContainer = angular.element($element[0].querySelector('.tab-bar'));

      // tab.content: tab content element
      // tab.label: tab label element
      function addTab(tab) {
        tabsList.add(tab);
        tab.label.attr('ng-click', "$onTabLabelClick(" + indexOf(tab) + ")");

        // 0: center
        // 1: right
        // -1: left
        var position = 0;

        if ($scope.selectedIndex === -1 || !angular.isNumber($scope.selectedIndex)) {
          $scope.selectedIndex = self.indexOf(tab);
        }

        if ($scope.selectedIndex > self.indexOf(tab)) {
          position = -1;
          tab.onAdd(position);
        } else if ($scope.selectedIndex < self.indexOf(tab)) {
          position = 1;
          tab.onAdd(position);
        } else {
          position = 0;
          tab.onAdd(position);
          tab.isSelected = true;
          self.select(position);
        }

        $compile(tab.label)($scope);

        self.tabBarContainer.append(tab.label);
      }

      function onTabLabelClick(tabIndex) {
        select(itemAt(tabIndex));
        if(mobos.Platform.isIOS()) {
          resizeTabContent(itemAt(tabIndex));
        }
      }

      // Select the tab, which is to the left/right of the current tab.
      function select(tab, toRight) {
        if (!tab || tab.isSelected) return;
        if (!tabsList.contains(tab)) return;

        var currTabIndex = tabsList.indexOf(tab);
        var iIndex;
        angular.forEach(tabsList.items(), function (tab) {
          iIndex = indexOf(tab);
          if (iIndex < currTabIndex) {
            //   move left
            tab.onMove(false);
          } else if(iIndex > currTabIndex) {
            //   move right
            tab.onMove(true);
          }
        });

        if (!angular.isDefined(toRight)) {
          toRight = currTabIndex > $scope.selectedIndex;
        }
        deselect(getSelectedItem(), toRight);

        $scope.selectedIndex = tabsList.indexOf(tab);
        tab.isSelected = true;
        tab.onSelect(toRight);

        $scope.$broadcast('$mdTabsChanged');
      }

      function deselect(tab, toRight) {
        if (!tab || !tab.isSelected) return;
        if (!tabsList.contains(tab)) return;

        $scope.selectedIndex = -1;
        tab.isSelected = false;
        tab.onDeselect(toRight);
      }

      function getSelectedItem() {
        return tabsList.itemAt($scope.selectedIndex);
      }


      function resizeTabContent(tab) {
        "use strict";
        tab.element.css({
          'padding-bottom': '100px',
          'box-sizing': 'content-box'
        });
        $timeout(function() {
          tab.element.css('padding-bottom', '0px');
        }, 500);
      }

    }
  }

  TabsDirective.$inject = [];

})();
