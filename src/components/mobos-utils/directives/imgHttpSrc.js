;
(function () {
  "use strict";

  angular.module('mobos.utils')
    .directive('imgHttpSrc', ['$http','HTTP','Securify','$sce', function ($http, HTTP, Securify, $sce) {
                                  var directive = {
                                      scope: {
                                          url: '=imgHttpSrc',
                                          altUrl: '=onErrorSrc'
                                      },
                                      link: link,
                                      restrict: 'A'
                                  };
                                  return directive;

                                  function link(scope, element, attrs) {
                                	  
                                	  var _default_headers = {
                              				//'X-Api-Key' : Securify.encrypt('RNAttDoyvPGu2WxdctT58e0BQcfkhuWhxBv4YHQRQgI=', 'kef'),
                              				'Content-type': 'application/json'
                              			};
                                	  
                                	  scope.$watch("url", function () {

                                		  if(!!scope.url){
                                			  var requestConfig = {
                                					  method: 'Get',
                                					  url: scope.url,
                                					  responseType: 'arraybuffer',
                                					  cache: 'true',
                                					  headers : _default_headers,
                                					  timeout: HTTP.DEFAULT_TIMEOUT
                                			  };

                                			  $http(requestConfig)
                                			  .success(function(data) {
                                				/*  var arr = new Uint8Array(data);
                                				  
                                				  var raw = '';
                                				  var i, j, subArray, chunk = 5000;
                                				  for (i = 0, j = arr.length; i < j; i += chunk) {
                                					  subArray = arr.subarray(i, i + chunk);
                                					  raw += String.fromCharCode.apply(null, subArray);
                                				  }

                                				  var b64 = Base64.encode(raw);//btoa(raw);
                                				  attrs.$set('src', "data:image/png;base64," + b64);
                                				 */ 
                                				  if(!!data){
                                					  
                                					  var blob = new Blob(
                            									[ data ], 
                            									{ type: 'image/png' }
                            								);
                                      				  
                                      				  attrs.$set('src',URL.createObjectURL(blob)); 
                                				  }else{
                                					  attrs.$set('src',scope.altUrl);
                                				  }
                                				 
                                			  }).error(function(res){
                                				  attrs.$set('src',scope.altUrl);
                                			  });

                                		  }

                                	  },true);
                                     
                                	  
                                  }
                              }
                          ]);
})();