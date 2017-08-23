;
(function () {
  "use strict";

  angular.module('mobos.utils')
    .directive('fileHttpDownload', ['$http','HTTP','$sce', function ($http, HTTP, $sce) {
                                  var directive = {
                                      scope: {
                                          url: '=fileHttpDownload',
                                          fileName : '=download',
                                          extention:'=extention'
                                      },
                                      link: link,
                                      restrict: 'A'
                                  };
                                  return directive;

                                  function link(scope, element, attrs) {
                                	  
                                	  
                                	  var _default_headers = {
                              				'Content-type': 'application/json'
                              			};
                                	  

                                		  if(!!scope.url){
                                			  var requestConfig = {
                                					  method: 'Get',
                                					  url: scope.url,
                                					  responseType: 'arraybuffer',
                                					  cache: 'true',
                                					  headers : _default_headers,
                                					  timeout: "180000"
                                			  };
                                			  
                                			  var linkElement = angular.element('<a> </a>');
                                			  
                                			  var clickingCallback = function() {
                                				  $http(requestConfig)
                                    			  .success(function(data, status, headers) {
                                    				  
                                    				  var resHeaders = headers();
                                    				  var filename = scope.fileName;//resHeaders['x-filename'];
                                    				  var extention =  scope.extention;
                                    			      var contentType = resHeaders['content-type'];
                                    			        
                                    			        try {
                                    			            var blob = new Blob([data], { type: contentType });
                                    			            var url = window.URL.createObjectURL(blob);
                                    			            var linkElement = document.createElement('a');
                                    			           
                                    			            linkElement.href = url;

                                    			            var ext = filename.substr(0, filename.lastIndexOf('.')) || undefined;
                                    			            if (ext != undefined) {
                                    			            	filename = ext+'.'+extention;
															} else {
																filename = filename+'.'+extention;
															}
                                    			            
                                    			            linkElement.setAttribute('download', filename);
                                    			            document.body.appendChild(linkElement); //Append the element to work in firefox
                                    			            linkElement.click();
                                    			            document.body.removeChild(linkElement); 
                                    			           
                                    			        } catch (ex) {
                                    			            console.log(ex);
                                    			        }
                                    				 
                                    			  }).error(function(res){
                                    				  attrs.$set('src',scope.altUrl);
                                    			  });
                                			    };
                                			    element.css({'cursor': 'pointer'});
                                			    element.bind('click', clickingCallback);
                                			 

                                		  }

                                     
                                	  
                                  }
                              }
                          ]);
})();