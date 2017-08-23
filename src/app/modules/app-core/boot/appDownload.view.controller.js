;
(function () {

  angular.module('app')
    .controller('AppDownloadViewController', [
      '$scope', 'blockUI', 'DEFAULT_ENDPOINT',
      AppDownloadViewController]);

  function AppDownloadViewController($scope, blockUI, DEFAULT_ENDPOINT) {
    
    function _init() {
    	
    	 if(!mobos.Platform.isWebView()){
       	  $scope.mobileBrowserDetect();        	  
       }
    }
    
    
    $scope.mobileBrowserDetect = function () {
    	blockUI.start("Redirecting to Download App...", {
			status: 'isLoading'
		});
		if (DEFAULT_ENDPOINT.MOBILE_REDIRECT.android != "" || DEFAULT_ENDPOINT.MOBILE_REDIRECT.ios != "") {
			if( (navigator.userAgent.toLowerCase().indexOf("android") > -1) || (navigator.userAgent.toLowerCase().indexOf("windows phone") > -1) || 
					(navigator.userAgent.toLowerCase().indexOf("blackBerry") > -1) ){
				window.location.href = url = DEFAULT_ENDPOINT.MOBILE_REDIRECT.android;
			}
			if( (navigator.userAgent.toLowerCase().indexOf("iphone") > -1) || (navigator.userAgent.toLowerCase().indexOf("ipod") > -1) || 
					(navigator.userAgent.toLowerCase().indexOf("ipad") > -1) ){
				window.location.href = DEFAULT_ENDPOINT.MOBILE_REDIRECT.ios;
			}
		}
		blockUI.stop();	
	};
    
	
	_init();
    
  }

})();
