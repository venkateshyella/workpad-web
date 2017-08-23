/**
 * Created by sudhir on 26/5/15.
 */

;(function() {
  "use strict";

  angular.module('app.base-controllers', [])
    .controller('ViewBaseController', ViewBaseController)
  ;

  function ViewBaseController($scope, Lang, Popup) {
    var self = this;
    self.LANG = Lang.en.data;
    self.Popup = Popup;

  }
  ViewBaseController.$inject = [
    '$scope', 'Lang', 'Popup'
  ];

})();