/**
 * Created by sudhir on 13/7/15.
 */

;(function() {
  "use strict";

  angular.module('mobos.utils')
    .service('AppLogger', AppLogger)
  ;

  function AppLogger() {

    var options = {
      maxItems: 100
    };
    var logBucket = [];

    return {
      log: log,
      warn: log,
      error: log,
      logBucket: logBucket
    };

    /**
     *
     * @desc Log simple string messages into the log bucket.
     *
     * TODO(Sudhir) Implement Fixed length log bucket which deletes old records to make room for new ones.
     * @param msg
     * @param opts
     */
    function log(msg, opts) {
      if(logBucket.length < options.maxItems) {
	      var newLogEntry = {
		      ts: Date.now(),
		      msg: msg
	      };
        logBucket.push(newLogEntry);
	      //console.log('['+Date(newLogEntry.ts)+'] '+msg)
      }
    }

  }

})();

