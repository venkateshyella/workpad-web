/**
 * Created by sudhir on 19/5/15.
 */

;(function() {
  "use strict";

  angular.module('mobos.utils')
  .directive('autoComplete', AutoCompleteDirective);

  function AutoCompleteDirective($q, Connect, URL) {
	  
	   var _connectionParams = { url: '', 
			                     params: {},
	   							 paramName: ""	
	                           }
	   , _placeHolder
	   , _searchType
	   ;
	                          
	                           
	  
	    function preLink(scope, elem, attrs) {
	    	if(attrs.searchType){
	    		prepareConnectionParams(attrs.searchType);
	    		_searchType = attrs.searchType;
	    	}
	    	
	    	if(attrs.placeholder){
	    		_placeHolder = attrs.placeholder;
	    	}
	    	
	    	scope.placeholder = _placeHolder;
	    	scope.searchType = _searchType;
	    	scope.connectionParams = _connectionParams;
	    }

	    function postLink(scope, elem, attrs) {
	    	
	    }

	    function prepareConnectionParams(searchType){
	    	switch (searchType) {
	          case "location":
	        	  _connectionParams.url = URL.CITY_LIST;
	        	  _connectionParams.params.cityName = "";
	        	  _connectionParams.paramName = "cityName";
	            break;
	          case "skill":
	        	  _connectionParams.url = URL.ADDSKILL;
	        	  _connectionParams.params.name = "";
	        	  _connectionParams.paramName = "name";
	        	  break;  

	          default:
	        }
	    }
	    
	    function AutoCompleteController($scope){
	    	//$scope.newLocationName = "";
	    	$scope.model = "";
	    	$scope.searchLocationText = "";
	    	$scope.searchLocationTextChange = searchLocationTextChange;
	    	$scope.addLocation = addLocation;
	    	$scope.selectedLocItemChange = selectedLocItemChange;
	    	$scope.queryLocSearch = queryLocSearch;
	    	$scope.searchLocStatusText = "";
	    	$scope.locObj = {};
	    	$scope.locObj.locationName = "";
	    	$scope.locObj.enable = false;
	    	
	    	//$scope.placeholder = _placeHolder;
	    	//$scope.searchType = _searchType;

	    	function searchLocationTextChange($model, text) {
	    		//console.info('Text changed to ' + text);
	    		if (text && text.length < 1) {
	    			$scope.locObj.locationName = "";
	    			$scope.locObj.enable = false;
	    		}
	    	}

	    	function addLocation(locName) {

	    		if (locName && locName.length > 0) {
	    			$scope.locObj.locationName = locName;
	    			$scope.locObj.enable = true;
	    		}

	    		// $scope.submit();
	    	};

	    	function selectedLocItemChange(item) {
	    		if (item) {
	    			console.log("selected Item");
	    			$scope.isAddLocDisabled = false;
	    			$scope.model = item;
	    		}
	    	}

	    	function queryLocSearch(searchText) {
	    		var deferred;
	    		var query = searchText || "";
	    		if (query) {
	    			deferred = $q.defer();
	    			
	    			var _params =  $scope.urlConParams.params;
	    			$scope.urlConParams.params[$scope.urlConParams.paramName] = query;
	    			
	    			Connect.get($scope.urlConParams.url, _params)
	    			.then(function (resp) {
	    				if (resp.responseCode != 0) {
	    					// Connection Error
	    					$scope.addLocations = [];
	    					$scope.searchLocStatusText = resp.respMsg;
	    				} else {
	    					var locations = resp.resp;
	    					$scope.addLocations = locations.results;
	    					$scope.searchLocStatusText = query;
	    				}

	    				if (resp.resp.length == 0) {
	    					$scope.isAddLocDisabled = true;
	    				}


	    				deferred.resolve($scope.addLocations);
	    			})
	    			.catch(function (error) {
	    				$scope.searchLocStatusText = LANG.ERROR.NETWORK_FAILURE;
	    				deferred.reject(error);
	    			});
	    			return deferred.promise;
	    		}
	    	}

	    }
	  

	  return {
	      restrict: 'E',
	      priority: 0,
	      link: {
	        pre: preLink,
	        post: postLink
	      },
	      scope: {
              model: '=ngModel',
              urlConParams: '=urlParams'
          },
	      transclude: true,
	      templateUrl: function (tElement, tAttrs) {
		        var templateUrl = '';
		        switch (tAttrs) {
		          case "locationSearch":
		            templateUrl = 'components/mobos-utils/directives/autoComplete/autocomplete.tpl.html';
		            break;

		          default:
		        	  templateUrl = 'components/mobos-utils/directives/autoComplete/autocomplete.tpl.html';
		        }
		        return templateUrl;
		      },
		     
	      controller: ['$scope', AutoCompleteController]
	    }

  }
  AutoCompleteDirective.$inject=['$q', 'Connect', 'URL'];

  
})();
