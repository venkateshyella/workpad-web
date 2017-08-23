/*!
   angular-block-ui v0.2.0
   (c) 2015 (null) McNull https://github.com/McNull/angular-block-ui
   License: MIT
*/
(function(angular) {

angular.module('myApp', [
  'ngRoute',
  'ngSanitize',
//  'ngResource',
  'ngAnimate',
  'blockUI',
  'markdown',
  'responseLag',
  'inform',
  'inform-exception',
  'inform-http-exception'
], null).value('navItems', [
  {
    text: 'Home',
    url: '#!/'
  },
  {
    text: 'Documentation',
    url: '#!/examples',
    pattern: '/examples(/.*)?'
  }
]).config(["$routeProvider", "examplesRoutes", function ($routeProvider, examplesRoutes) {

  $routeProvider.when('/', {
    templateUrl: 'app/main/home.ng.html'
  });

  angular.forEach(examplesRoutes, function (value, key) {
    $routeProvider.when(key, value);
  });

  $routeProvider.otherwise({
    redirectTo: '/'
  });

}]).config(["blockUIConfig", "responseLagConfig", "$locationProvider", function (blockUIConfig, responseLagConfig, $locationProvider) {

  // Enable hashbangs

  $locationProvider.hashPrefix('!');

  blockUIConfig.blockBrowserNavigation = true;
  
  if(window.location.search.indexOf('delay=false')!=-1 ||
    window.location.search.indexOf('_escaped_fragment_')!=-1 ||
    window.navigator.userAgent.indexOf('Prerender')!=-1) {

    responseLagConfig.enabled = false;
    blockUIConfig.autoBlock = false;
    blockUIConfig.autoInjectBodyBlock = false;
  } else {
    responseLagConfig.excludes.push(/.*\.md/i);
    responseLagConfig.enabled = true;
    responseLagConfig.timeout.min = 750;
    responseLagConfig.timeout.max = 1500;

//    // Change the displayed message based on the http verbs being used.
//    blockUIConfig.requestFilter = function(config) {
//
//      var message;
//
//      switch(config.method) {
//
//        case 'GET':
//          message = 'Getting ...';
//          break;
//
//        case 'POST':
//          message = 'Posting ...';
//          break;
//
//        case 'DELETE':
//          message = 'Deleting ...';
//          break;
//
//        case 'PUT':
//          message = 'Putting ...';
//          break;
//      }
//
//      return message;
//
//    };
  }

//  blockUIConfig.template = '<pre><code>{{ state | json }}</code></pre>';

//  blockUIConfig.delay = 200;

}]).controller('MainController', ["$scope", "blockUI", function($scope, blockUI) {
//  blockUI.start();
}]);

angular.module('myApp').directive('confirm', ['$window', function($window) {
  return {
    restrict: 'A',
    priority: 100,
    link: function(scope, element, attr) {
      element.bind('click', function(e) {
        var msg = attr.confirm;

        if(!$window.confirm(msg)) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      });
    }
  };
}]);


angular.module('myApp').controller('ElementBlockingController', ["$scope", "blockUI", function($scope, blockUI) {

  $scope.toggleBlock = function(name) {

    // Get a reference to the blockUI instance
  
    var myBlock = blockUI.instances.get(name);

    if(myBlock.state().blocking) {
      myBlock.stop();
    } else {
      myBlock.start();
    }
  };

}]);


angular.module('myApp').constant('examplesRoutes', {
  '/examples': {
    redirectTo: '/examples/documentation'
  },
  '/examples/:example': {
    templateUrl: 'app/examples/examples.ng.html',
    controller: 'ExamplesController'
  }
});

angular.module('myApp').controller('ExamplesController', ["$scope", "$routeParams", function($scope, $routeParams) {

  function urlToName(str) {
    str = str.charAt(0).toUpperCase() + str.slice(1);
    return str.replace(/\W+(.)/g, function(i, c) {
      return ' ' + c.toUpperCase();
    });
  }

  function nameToUrl(str) {
    str = str.toLowerCase();
    return str.replace(/\s+/g, '-');
  }

  function indexOfExample(name, examples) {

    var i = examples.length;
    while (i--) {
      if (examples[i].name === name) {
        return i;
      }
    }
    return -1;
  }

  $scope.examples = [{
    name: 'Documentation',
    tmpl: 'app/examples/readme.html'
  }, {
    name: 'Manual Blocking Examples',
    tmpl: 'app/examples/manual-blocking.html'
  }, {
    name: 'Element Blocking Examples',
    tmpl: 'app/examples/element-blocking.html'
  }, {
    name: 'Focus Management',
    tmpl: 'app/examples/focus-input.html'
  }];

  $scope.examples.active = indexOfExample(urlToName($routeParams.example), $scope.examples);
  $scope.examples.getUrl = function(example) {
    return '#!/examples/' + nameToUrl(example.name);
  };

}]);

angular.module('myApp').controller('FocusInputExampleController', ["$scope", "blockUI", "$timeout", function($scope, blockUI, $timeout) {

  var loginFormBlock = blockUI.instances.get('loginFormBlock');

  $scope.login = function() {
    loginFormBlock.start('Validating account ...');

    $timeout(function() {
      loginFormBlock.stop();
    }, 2000);
  };

  var searchFormBlock = blockUI.instances.get('searchFormBlock');

  $scope.search = function() {
    searchFormBlock.start('Searching ...');

    $timeout(function() {
      searchFormBlock.stop();
    }, 2000);
  };  

  $scope.globalBlock = function() {

    blockUI.start('Blocking whole page ...');

    $timeout(function() {
      blockUI.stop();
    }, 2000);

  };
}]);

angular.module('myApp').controller('ManualBlockingController', ["$scope", "blockUI", "$timeout", "$http", "$window", "inform", function($scope, blockUI, $timeout, $http, $window, inform) {

  $scope.startBlock = function() {
    blockUI.start();

    $timeout(function() {
      blockUI.stop();
    }, 2000);
  };

  $scope.startBlockWithMessage = function() {
    blockUI.start("My custom message");

    $timeout(function() {
      blockUI.stop();
    }, 2000);
  };

  $scope.startBlockUpdateMessage = function() {
    blockUI.start();

    $timeout(function() {
      blockUI.message('Still loading ...');
    }, 1000);

    $timeout(function() {
      blockUI.message('Almost there ...');
    }, 2000);

    $timeout(function() {
      blockUI.message('Cleaning up ...');
    }, 3000);

    $timeout(function() {
      blockUI.stop();
    }, 4000);
  };

  $scope.resetOnError = function() {
    blockUI.start();

    $timeout(function() {
      throw new Error('Oh dear!');
      blockUI.stop(); // Stop will never be called
    }, 1000);

  };

  $scope.withHttpRequest = function() {

    $http.get('index.html').then(function(data) {
      inform.add('Data received from server', { type: 'success' });
    });
  };

  $scope.executeWhenDone = function() {

    blockUI.start();

    blockUI.done(function() {
      inform.add('BlockUI has finished.');
    });

    $timeout(function() {
      blockUI.stop();
    }, 1000);
  };
}]);
angular.module('myApp').directive('myDemoTable', ["myFakeDataResource", function(myFakeDataResource) {
  return {
    templateUrl: 'app/examples/my-demo-table.ng.html',
    link: function($scope, $element, $attrs) {

      $scope.table = {
        items: [],
        offset: 0,
        limit: 10,
        previous: function() {
          $scope.table.offset = Math.max(0, $scope.table.offset - 10);
        },
        next: function() {
          $scope.table.offset = Math.min(40, $scope.table.offset + 10);
        },
        emptyRows: function() {
          return new Array($scope.table.limit - $scope.table.items.length);
        }
      };

      $scope.$watch($attrs.limit, function(v) {
        $scope.table.limit = v === undefined ? $scope.table.limit : v;
      });

      $scope.$watchCollection('[ table.offset, table.limit ]', function(value) {
        myFakeDataResource.query({ limit: $scope.table.limit, offset: $scope.table.offset }).$promise.then(function(data) {
          $scope.table.items = data;
        });
      });
    }
  };
}]);

angular.module('myApp').factory('myFakeDataResource', ["$http", "$q", function($http, $q) {

  return {
    query: function(params) {

      var d = $q.defer();

      var ret = [];

      ret.$resolved = false;
      ret.$promise = d.promise;
      $http.get('app/examples/data-array.json').then(function(response) {
        
        ret.length = 0;
        
        if(params.offset + params.limit >= response.data.length) {
          params.offset = 0;
        }
        
        response.data = response.data.splice(params.offset, params.limit);
        Array.prototype.push.apply(ret, response.data);
      
        d.resolve(ret);
      });

      return ret;
    }
  };

}]);
angular.module('myApp').controller('NavbarController', ["$scope", "$location", "navItems", function ($scope, $location, navItems) {

  var self = this;

  this.setActiveNavItem = function(url) {

    for(var i = 0; i < navItems.length; i++) {

      var navItem = navItems[i];
      var regexp = navItem.$_regexp;

      if(!regexp) {
        var pattern = navItem.pattern;

        if (!pattern) {
          pattern = navItem.url || '/';
          pattern = pattern.replace(/^#!/, '')
        }

        regexp = new RegExp('^' + pattern + '$', 'i');
        navItem.$_regexp = regexp;
      }

      navItem.isActive = regexp.test(url);
    }
  };

  $scope.navItems = navItems;

  $scope.$watch(function () {
    return $location.path();
  }, function(newValue) { self.setActiveNavItem(newValue) });

  $scope.navItems.isCollapsed = true;

  $scope.toggleCollapse = function() {
    $scope.navItems.isCollapsed = !$scope.navItems.isCollapsed;
  };

  $scope.collapseNavItems = function() {
    $scope.navItems.isCollapsed = true;
  };

}]);

angular.module('myApp').directive('navbar', ["$location", function ($location) {

  var routePatternAttribute = 'data-route-pattern';

  return {
    restrict: 'A',
    templateUrl: 'app/navbar/navbar.ng.html',
    controller: 'NavbarController',
    replace: true
  };
}]);

// Automatically generated.
// This file is already embedded in your main javascript output, there's no need to include this file
// manually in the index.html. This file is only here for your debugging pleasures.
angular.module('myApp').run(['$templateCache', function($templateCache){
  $templateCache.put('app/examples/examples.ng.html', '<div class=\"container\"><h1>Angular BlockUI Documentation &amp; Examples</h1><ul class=\"nav nav-tabs spacer\"><li ng-repeat=\"example in examples\" ng-class=\"{ active: $index === examples.active }\"><a href=\"{{ examples.getUrl(example) }}\">{{ example.name }}</a></li></ul><div class=\"spacer\" ng-include=\"examples[examples.active].tmpl\"></div></div>');
  $templateCache.put('app/examples/my-demo-table.ng.html', '<div class=\"my-demo-table\"><table class=\"table\"><tr><th>Name</th><th>Lastname</th><th>Email</th><th>Country</th></tr><tr ng-repeat=\"item in table.items\"><td>{{ item.first_name }}</td><td>{{ item.last_name }}</td><td>{{ item.email }}</td><td>{{ item.country }}</td></tr><tr ng-repeat=\"e in table.emptyRows() track by $index\"><td colspan=\"4\">&nbsp;</td></tr></table><ul class=\"pagination\"><li><a href=\"\" ng-click=\"table.previous()\">&laquo;</a></li><li ng-repeat=\"i in [1,2,3,4,5]\" ng-class=\"{ active: ($index * 10) === table.offset }\"><a href=\"\" ng-click=\"table.offset = $index * 10\">{{ i }}</a></li><li><a href=\"\" ng-click=\"table.next()\">&raquo;</a></li></ul></div>');
  $templateCache.put('app/main/home.ng.html', '<div class=\"container\"><div class=\"jumbotron\"><h1>Angular BlockUI</h1><p>A simple AngularJS module that allows you to block user interaction on AJAX requests.</p><p><a class=\"btn btn-primary btn-lg\" href=\"#!/examples\">Documentation »</a></p></div></div>');
  $templateCache.put('app/navbar/navbar.ng.html', '<div class=\"navbar navbar-default text-select-disable\" role=\"navigation\"><div class=\"container-fluid\"><div class=\"navbar-header\"><button type=\"button\" class=\"navbar-toggle\" ng-click=\"toggleCollapse()\"><span class=\"sr-only\">Toggle navigation</span> <span class=\"icon-bar\"></span> <span class=\"icon-bar\"></span> <span class=\"icon-bar\"></span></button> <a class=\"navbar-brand\" href=\"#!/\">Angular BlockUI</a></div><div class=\"navbar-collapse\" ng-class=\"{ collapsed: navItems.isCollapsed }\"><ul class=\"navbar-nav nav\"><li ng-repeat=\"navItem in navItems\" ng-class=\"{ active: navItem.isActive }\"><a ng-href=\"{{ navItem.url }}\" ng-click=\"collapseNavItems()\">{{ navItem.text }}</a></li></ul></div></div></div>');
}]);
})(angular);
//# sourceMappingURL=app.js.map