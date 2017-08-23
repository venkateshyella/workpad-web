;(function() {
  "use strict";

  angular.module('app').config(function(blockUIConfig) {

    // Change the default overlay message
    //blockUIConfig.message = 'Please stop clicking!';

    // Change the default template.
    //blockUIConfig.template =
    //  '<div class="block-ui-overlay"></div>'+
    //  '<div class="block-ui-message-container" aria-live="assertive" aria-atomic="true">'+
    //    '<div class="block-ui-message" ng-class="$_blockUiMessageClass">'+
    //      '<div><span ng-bind="state.message"></span></div>'+
    //      '<div>' +
    //        '<div class="spinner">'+
    //          '<div class="bounce1"></div>'+
    //          '<div class="bounce2"></div>'+
    //          '<div class="bounce3"></div>'+
    //        '</div>'+
    //      '</div>'+
    //    '</div>'+
    //  '</div>';

    blockUIConfig.templateUrl = 'app/modules/config/blockUI-loader.tpl.html';

    //blockUIConfig.template =
    //  '<div class="block-ui-overlay"></div>'+
    //  '<div class="block-ui-message-container appProgressBlocker" aria-live="assertive" aria-atomic="true">'+
    //    '<div class="block-ui-message with-loader-left" ng-class="$_blockUiMessageClass">'+
    //      '<div ng-show="options.isLoading" class="">' +
    //        '<span ng-bind="state.message"></span></div>'+
    //      '<div class="loader-left ">' +
    //          '<div ng-switch="options.status">' +
    //            '<div ng-switch-when="isLoading">' +
    //            '</div>' +
    //            '<md-progress-circular md-mode="indeterminate" aria-valuemin="0" aria-valuemax="100" role="progressbar" class="md-default-theme" style="-webkit-transform: scale(1);"><div class="md-spinner-wrapper"><div class="md-inner"><div class="md-gap"></div><div class="md-left"><div class="md-half-circle"></div></div><div class="md-right"><div class="md-half-circle"></div></div></div></div></md-progress-circular>'+
    //          '</div>' +
    //      '</div>'+
    //    '</div>'+
    //  '</div>';

    blockUIConfig.autoBlock = false;

    blockUIConfig.autoInjectBodyBlock = false;

    blockUIConfig.delay = 250;

    //blockUIConfig.template = '<pre><code>{{ state | json }}</code></pre>';

    /*
    * <pre><code class="ng-binding">{
     "id": "registerInProgressBlocker",
     "blockCount": 1,
     "message": "Creating your account",
     "blocking": true
     }</code></pre>
     */

  });

})();