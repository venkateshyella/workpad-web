;
(function () {
  "use strict";

  angular.module('mobos.utils')
    .directive('meetingStatusPoll', ['$http', '$timeout', '$interval','Connect','URL',
                                     function ($http, $timeout, $interval, Connect, URL) {
    	
                                  var directive = {
                                      scope: {
                                          options: '=options',
                                          statusResponse: '=?statusResponse'
                                      },
                                      link: link,
                                      restrict: 'E'
                                  };
                                  return directive;

                                  function link(scope, element, attrs) {
                                	  
                                	  var hasvaluereturnd = true; // Flag to check 
                                	  var thresholdvalue = 5;
                                	  
                                	  var _options = {
                                			  endPointParams: {},
                                			  endPointUrl: '',
                                			  pollIntervalSec: 5,
                                			  responseAttribute: null
                                	  };
                                	  
                                	  if(scope.options){
                                		  _options = angular.extend(_options, scope.options);
                                	  }
                                	  
                                	  function poll(interval, callback) {
                                	        return $interval(function () {
                                	            if (hasvaluereturnd) {  //check flag before start new call
                                	                callback(hasvaluereturnd);
                                	            }
                                	            thresholdvalue = thresholdvalue - 1;  //Decrease threshold value 
                                	            if (thresholdvalue == 0) {
                                	              //  scope.stopPoll(); // Stop $interval if it reaches to threshold
                                	            }
                                	        }, interval);
                                	    }
                                	  
                                	  
                                	  var pollpromise = poll((_options.pollIntervalSec * 1000), function (){
                                		  hasvaluereturnd = false;
                                		  //$timeout(function () {  // if server takes more time then interval
                                		  Connect.get(_options.endPointUrl, _options.endPointParams)
                                		  .then(function (res) {
                                			  hasvaluereturnd = true;  // set Flag to true
                                			   if(res.resp){
                                				   scope.statusResponse = scope.statusResponse || {};
                                				   if(res.resp[_options.responseAttribute]){
                                					   scope.statusResponse = res.resp[_options.responseAttribute];
                                				   }else{
                                					   scope.statusResponse = res.resp;
                                				   }
                                			   }
                                		  },
                                		  function (e) {
                                			  hasvaluereturnd = true; // set Flag to true
                                		  })
                                		  .catch(function (err) {
                                			  console.log(err);
                                		  });

                                		  //}, 2000); 
                                	  });
                                	  
                                	  
                                	// stop interval.
                                	    scope.stopPoll = function () {
                                	        $interval.cancel(pollpromise);
                                	        thresholdvalue = 0;     //reset all flags. 
                                	        hasvaluereturnd = true;
                                	    };
                                	    
                                	      scope.$on('$destroy', function() {
                                	    	  scope.stopPoll();
                                	      });
                                	  
                                  }
                              }
                          ]);
})();