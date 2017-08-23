/**
 * Created by Sandeep on 31/01/17.
 */

;(function() {
  "use strict";

  var app = angular.module('app.modules')
      .service('SubscriptionPostHandler', [
        '$q', 'DataProvider',
        'Connect', 'URL', 'mDialog', 'blockUI', 
        'Lang','State','$mdDialog',
        SubscriptionPostHandler
      ])
  ;

  function SubscriptionPostHandler ($q, DataProvider
    , Connect, URL
    , Dialog, blockUI
    , Lang, State, $mdDialog) {

    var LANG = Lang.en.data;

    return {
    	handle_subscriptionRequest: handle_subscriptionRequest
    };


    function handle_subscriptionRequest(post, options) {
      var deferred = $q.defer();
      Dialog.show({
    	  targetEvent: options.targetEvent,
    	  templateUrl: 'app/modules/posts/templates/subscriptionPost.dialog.tpl.html',
    	  locals: {
    		  title: post.title,
    		  content: post.notificationDescription,
    		  ok: "Subscibe",
    		  cancel: "Cancel",
    		  LANG: LANG,
    		  org: post.organization,
    		  group: post.group,
    		  job: post.job,
    		  task: post.task,
    		  post:post,
    		  action: {
    		      subscribe: function () {
    		    	  State.transitionTo('root.app.subscription', {
    					  orgId:post.organization.id
    		            }, {
    		            	FLAGS: {
    							CLEAR_STACK: true
    						}
    		            });
    			  }
    		  }
    	  }
      
      }).then(function(res) {
    	  updateViewPost();
      }).catch(function() {
      });
      return deferred.promise;
      
      function updateViewPost(){
    	  post.toggleRead(true)
			.then(function () {
				deferred.resolve();
			});
      }
    }
  }
})();