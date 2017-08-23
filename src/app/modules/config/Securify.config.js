/**
 * Created by sudhir on 5/6/15.
 */

;(function() {


  angular.module('app').config(function(SecurifyProvider) {
    SecurifyProvider.addNewPreset('pef', '00000000000000000000000000000000', 'w0B1MoRdpaDW0BvApP');
    SecurifyProvider.addNewPreset('kef', '00000000000000000000000000000000', 'w0B1MoRdpaDW0BvApP',{iterationCount : 1000});

  });

})();
