/**
 * Created by sudhir on 31/8/15.
 */


;(function() {
  "use strict";

  angular.module('chatter')
    .provider('ChatterStore', [
      ChatterStoreProvider])
  ;

  function ChatterStoreProvider() {
    var options = {};
    return {
      $get: ['$q', '$timeout', ChatterStoreFactory],
      configure: configure
    };

    function configure(opts) {
      angular.extend(options, opts);
    }

    function ChatterStoreFactory($q, $timeout) {

      return ChatterStore;

      function ChatterStore() {
        var self = this
          , mq_write
          ;
        _reset(options);

        self.read = read;
        self.write = write;

        /**
         * Save a new message in a chatroom
         * @param msgObj
         * @param idChatroom
         */
        function addMessageToChatRoom(msgObj, idChatroom) {}

        function _reset(options) {
          self.options = angular.copy(options);
          mq_write = [];
        }

        function write(msgObj) {}

        function read(params) {}
      }
    }
  }

})();