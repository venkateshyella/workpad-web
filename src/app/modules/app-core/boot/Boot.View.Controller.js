/**
 * Created by rihdus on 22/4/15.
 */

;
(function () {
  angular.module('app.core')
    .controller('BootViewController', ['$scope', '$timeout', '$q', '$sce',
      'BootService', 'AppCoreUtilityServices',
      'mDialog', 'FormService',
      'Lang', 'DEFAULT_ENDPOINT',
      '$location',
      BootViewController]);

  function BootViewController($scope, $timeout, $q, $sce
    , BootService, AppCoreUtilityServices
    , Dialog, FormService
    , Lang, DEFAULT_ENDPOINT
    , $location) {
    var TAG = 'BootViewController'
      , DEFAULT_MESSAGE = "Booting"
      , LANG;

    window.FormService = FormService;
    intialize();
    runBoot();

    function intialize() {
      $scope.bootState = {};
      $scope.enableRetry = false;
      $scope.runBoot = runBoot;
      $scope.loginAction = loginAction;
    }

    function runBoot() {
      $scope.bootInProgress = true;
      $scope.enableLoginAction = false;
      $scope.enableRetry = false;
      BootService.readyApp().then(
        function onBootComplete(result) {
          $scope.bootInProgress = false;
          LANG = Lang.en.data;

          /*
           * Check if new update is available. */
        /*  AppCoreUtilityServices;
          if (AppCoreUtilityServices.isNewUpdateAvailable(
              BootService.bootDigest.ping.result.appDetails)) {
            runAppUpdate(BootService.bootDigest.ping.result.appDetails);
          } else {
            BootService.resolveAppReadyListeners();
          }
        */  
          /**
           * Show confirm message for app download in mobile web browser
           */
          if(!mobos.Platform.isWebView() && $location.url().indexOf('appDownload') == -1){
        	 $scope.mobileBrowserDetect();        	  
          }
          
          
          BootService.resolveAppReadyListeners();
        },
        function onBootError(error) {
          var errorMsg = error.respMsg;

          LANG = Lang.en.data;

          $scope.bootState.msg = errorMsg;
          $scope.enableRetry = true;
          $scope.bootInProgress = false;
          /*
          if (BootService.bootDigest.ping && BootService.bootDigest.ping.result) {
            if (AppCoreUtilityServices.isNewUpdateAvailable(
                BootService.bootDigest.ping.result.appDetails)) {
              runAppUpdate(BootService.bootDigest.ping.result.appDetails);
            } else {
              //BootService.resolveAppReadyListeners();
            }
          } else {

          }
			*/
        },
        function onBootNotification(notification) {
          var fail_step_code = notification.data.failStepCode;

          /* show message if available
           * else reset message to default boot message*/
          if (notification && notification.data && notification.data.msg) {
            $scope.bootState.msg = notification.data.msg
          } else {
            $scope.bootState.msg = DEFAULT_MESSAGE;
          }

          switch (fail_step_code) {
            case "AUTHENTICATING_USER_ERROR":
              $scope.enableLoginAction = true;
              break;
            default:
          }

        }
      )
    }

    function runAppUpdate(updateInfo) {

      if (mobos.Utils.isStrictUrl(updateInfo.url)) {
        Dialog[mobos.Platform.isAndroid() ? 'showConfirm' : 'showAlert']({
          title: LANG.DIALOG.APP_UPDATE.TITLE,
          content: $sce.trustAsHtml(LANG.DIALOG.APP_UPDATE.CONTENT),
          ok: LANG.DIALOG.APP_UPDATE.OK_TEXT,
          cancel: LANG.DIALOG.APP_UPDATE.CANCEL_TEXT
        }).then(_update, _exit);

        function _update() {
          if (mobos.Platform.isWebView()) {
            window.open(updateInfo.url, '_system');
          } else {
            window.open(updateInfo.url, '_blank', {
              menubar: false,
              height: 568,
              width: 320
            });
          }
          $scope.bootState.msg = "Please restart the application";
        }
      } else {
        Dialog.showAlert({
          title: "Invalid url found.",
          content: "The update url found was invalid.",
          okText: "Retry"
        })
      }

      function _exit() {
        if (mobos.Platform.isWebView()) {
          mobos.Platform.exitApp();
        } else {
          window.location.reload();
        }
      }
    }

    function loginAction() {
      "use strict";
      BootService.resolveAppReadyListeners();
    }
    
    
    function redirectProcess(url) {
		Dialog.show({
			clickOutsideToClose:false,
	         template:
	           '<md-dialog class="app-confirm-popup" aria-label="List dialog">' +
	           '<md-toolbar >'+
			      '<div class="md-toolbar-tools">'+
			         '<h2>Workpad app</h2>'+
			         '<span flex></span>'+
			         '<md-button class="md-icon-button" ng-click="close()">'+
			            '<md-icon md-font-icon="icon icon-close" aria-label="Close dialog"></md-icon>'+
			         '</md-button>'+
			      '</div>'+
			   '</md-toolbar>'+
	           '  <md-dialog-content>'+
	           '    Do you wish to download the app?'+
	           '  </md-dialog-content>' +
	           '<div class="md-actions full-width" layout="row">'+
	           '<span flex></span>'+
	           '<md-button ng-click="close()">'+
	           '   Continue to mobile site'+
	           '</md-button>'+
	           '   <md-button ng-click="redirectToApp()">'+
	           '   Download app'+
	           '</md-button>'+
	        '</div>'+
	           '</md-dialog>',
	         controller: ['$scope', 'mDialog', DialogController],
	      });
	      function DialogController($scope, Dialog) {
	        $scope.close = function() {
	        	Dialog.hide();
	        }
	        $scope.redirectToApp = function(){
	        	Dialog.hide();
	        	window.location.href = url;
	        }
	      }
		
	} 
	
	$scope.mobileBrowserDetect = function () {
		if (DEFAULT_ENDPOINT.MOBILE_REDIRECT.android != "" || DEFAULT_ENDPOINT.MOBILE_REDIRECT.ios != "") {
			if( (navigator.userAgent.toLowerCase().indexOf("android") > -1) || (navigator.userAgent.toLowerCase().indexOf("windows phone") > -1) || 
					(navigator.userAgent.toLowerCase().indexOf("blackBerry") > -1) ){
				redirectProcess(DEFAULT_ENDPOINT.MOBILE_REDIRECT.android);
			}
			if( (navigator.userAgent.toLowerCase().indexOf("iphone") > -1) || (navigator.userAgent.toLowerCase().indexOf("ipod") > -1) || 
					(navigator.userAgent.toLowerCase().indexOf("ipad") > -1) ){
				redirectProcess(DEFAULT_ENDPOINT.MOBILE_REDIRECT.ios);
			}
		}
		
	}
	
  }

})();

