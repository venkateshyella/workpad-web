// braintree service
(function () {
var braintreeWeb = window.braintree;

var braingular = window.angular.module('braintree-angular', [])

braingular.constant('clientToken', '')
braingular.factory('$braintree', [
  'clientToken',
  '$http',
  braintreeFactory(braintreeWeb)
])

braingular.directive('braintreeDropin', function () {
  return {
    restrict: 'AEC',
    scope: {
      options: '='
    },
    template: '<div id="bt-dropin"></div>',
    controller: ['$scope', '$braintree', '$rootScope',function ($scope, $braintree, $rootScope) {
      var options = $scope.options || {}
      options.container = 'bt-dropin';
      
      options.onError = function (obj) {
    	    if (obj.type == 'VALIDATION') {
    	      // Validation errors contain an array of error field objects:
    	      obj.details.invalidFields;

    	    } else if (obj.type == 'SERVER') {
    	      // If the customer's browser cannot connect to Braintree:
    	      obj.message; // "Connection error"

    	      // If the credit card failed verification:
    	      obj.message; // "Credit card is invalid"
    	      obj.details; // Object with error-specific information
    	    }
    	    
    	    
    	    $rootScope.$broadcast("btDropinError", {error : obj});
    	  };
      $braintree.setupDropin(options)
    }]
  }
})

braingular.directive('braintreePaypal', function () {
  return {
    restrict: 'AEC',
    scope: {
      options: '='
    },
    template: '<div id="bt-paypal"></div>',
    controller: ['$scope', '$braintree', function ($scope, $braintree) {
      var options = $scope.options || {}
      options.container = 'bt-paypal'

      $braintree.setupPayPal(options)
    }]
  }
})



function braintreeFactory (braintree) {
  return function braintreeAngular (clientToken, $http) {
	  
    var $braintree = {}

    $braintree.clientToken = null

    Object.keys(braintree).forEach(function (key) {
      $braintree[key] = braintree[key]
    })

    $braintree.getClientToken = function (params) {
      var path = clientToken

      if (params) {
        // TODO: Use a library for this
        path += '?'
        path += Object.keys(params).map(function (key) {
          var value = params[key]
          return key + '=' + value
        }).join('&')
      }

      return $http.get(path)
    }
 
    $braintree.setupDropin = function (options) {
    	var token = clientToken && clientToken.trim().length > 0 ?clientToken : $braintree.clientToken;
          braintree.setup(token, 'dropin', options);
    }

    $braintree.setupPayPal = function (options) {
    	$braintree.getHardClientToken()
        .success(function (token) {
          braintree.setup(token, 'paypal', options)
        })
        .error(function (data, status) {
          console.error('error fetching client token at ' + clientToken, data, status)
        })
    }
    
    $braintree.setClientToken = function(token){
    	$braintree.clientToken = token;
    };

    return $braintree
  }
}
})();
//module.exports = braingular
